/*
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {BackSide, BoxBufferGeometry, Cache, CubeCamera, DataTextureLoader, EventDispatcher, GammaEncoding, LinearToneMapping, Mesh, NearestFilter, RGBEEncoding, RGBEFormat, Scene, ShaderMaterial, Texture, TextureLoader, UnsignedByteType, WebGLRenderer, WebGLRenderTarget, WebGLRenderTargetCube} from 'three';
import {PMREMCubeUVPacker} from 'three/examples/jsm/pmrem/PMREMCubeUVPacker.js';
import {PMREMGenerator} from 'three/examples/jsm/pmrem/PMREMGenerator.js';

import {CubemapGenerator} from '../third_party/three/EquirectangularToCubeGenerator.js';
import {RGBELoader} from '../third_party/three/RGBELoader.js';
import {Activity, ProgressTracker} from '../utilities/progress-tracker.js';

import EnvironmentMapGenerator from './EnvironmentMapGenerator.js';

const targetCache = new Map<string, WebGLRenderTarget>();

export interface EnvironmentGenerationConfig {
  progressTracker?: ProgressTracker;
}

// Enable three's loader cache so we don't create redundant
// Image objects to decode images fetched over the network.
Cache.enabled = true;

const HDR_FILE_RE = /\.hdr$/;
const ldrLoader = new TextureLoader();
const hdrLoader = new RGBELoader();

export interface TextureUtilsConfig {
  cubemapSize?: number;
  pmremSamples?: number;
}

const defaultConfig: TextureUtilsConfig = {
  cubemapSize: 1024,
};

// Attach a `userData` object for arbitrary data on textures that
// originate from TextureUtils, similar to Object3D's userData,
// for help debugging, providing metadata for tests, and semantically
// describe the type of texture within the context of this application.
const userData = {
  url: null,
  // 'Equirectangular', 'Cube', 'PMREM'
  mapping: null,
};

export default class TextureUtils extends EventDispatcher {
  private config: TextureUtilsConfig;
  private renderer: WebGLRenderer;
  private environmentMapGenerator: EnvironmentMapGenerator|null = null;

  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {?number} config.cubemapSize
   */
  constructor(renderer: WebGLRenderer, config: TextureUtilsConfig = {}) {
    super();
    this.config = {...defaultConfig, ...config};
    this.renderer = renderer;
  }

  equirectangularToCubemap(texture: Texture): WebGLRenderTargetCube {
    const generator = new CubemapGenerator(this.renderer);

    let target = generator.fromEquirectangular(texture, {
      resolution: this.config.cubemapSize,
    });

    (target.texture as any).userData = {
      ...userData,
      ...({
        url: (texture as any).userData ? (texture as any).userData.url : null,
        mapping: 'Cube',
      })
    };

    return target;
  }

  async load(
      url: string, progressCallback: (progress: number) => void = () => {}):
      Promise<Texture> {
    try {
      const isHDR: boolean = HDR_FILE_RE.test(url);
      const loader: DataTextureLoader = isHDR ? hdrLoader : ldrLoader;
      const texture: Texture = await new Promise<Texture>(
          (resolve, reject) => loader.load(
              url, resolve, (event: {loaded: number, total: number}) => {
                progressCallback(event.loaded / event.total * 0.9);
              }, reject));

      progressCallback(1.0);

      (texture as any).userData = {
        ...userData,
        ...({
          url: url,
          mapping: 'Equirectangular',
        })
      };

      if (isHDR) {
        texture.encoding = RGBEEncoding;
        texture.minFilter = NearestFilter;
        texture.magFilter = NearestFilter;
        texture.flipY = true;
      } else {
        texture.encoding = GammaEncoding;
      }

      return texture;

    } finally {
      if (progressCallback) {
        progressCallback(1);
      }
    }
  }

  async loadEquirectAsCubeMap(
      url: string, progressCallback: (progress: number) => void = () => {}):
      Promise<WebGLRenderTargetCube> {
    let equirect = null;

    try {
      equirect = await this.load(url, progressCallback);
      return await this.equirectangularToCubemap(equirect);
    } finally {
      if (equirect != null) {
        (equirect as any).dispose();
      }
    }
  }

  /**
   * Returns a { skybox, environmentMap } object with the targets/textures
   * accordingly. `skybox` is a WebGLRenderCubeTarget, and `environmentMap`
   * is a Texture from a WebGLRenderCubeTarget.
   */
  async generateEnvironmentMapAndSkybox(
      skyboxUrl: string|null = null, environmentMapUrl: string|null = null,
      options: EnvironmentGenerationConfig = {}): Promise<{
    environmentMap: WebGLRenderTarget,
    skybox: WebGLRenderTargetCube|null
  }> {
    const {progressTracker} = options;
    let updateGenerationProgress: Activity|((...args: any[]) => void) =
        () => {};

    let skyboxLoads: Promise<WebGLRenderTargetCube|null> =
        Promise.resolve(null);
    let environmentMapLoads: Promise<WebGLRenderTarget|null> =
        Promise.resolve(null);

    let skybox: WebGLRenderTargetCube|null = null;
    let environmentMap: WebGLRenderTarget|null = null;

    try {
      let environmentMapWasGenerated = false;

      // If we have a specific environment URL, attempt to load it as a cubemap
      // The case for this is that the user intends for the IBL to be different
      // from the scene background (which may be a skybox or solid color).
      if (!!environmentMapUrl && !targetCache.has(environmentMapUrl + ':env')) {
        environmentMapLoads = this.loadEquirectAsCubeMap(
            environmentMapUrl,
            progressTracker ? progressTracker.beginActivity() : () => {});
      }

      // If we have a skybox URL, attempt to load it as a cubemap
      if (!!skyboxUrl && !targetCache.has(skyboxUrl)) {
        skyboxLoads = this.loadEquirectAsCubeMap(
            skyboxUrl,
            progressTracker ? progressTracker.beginActivity() : () => {});
      }

      updateGenerationProgress =
          progressTracker ? progressTracker.beginActivity() : () => {};

      // In practice, this should be nearly as parallel as Promise.all (which
      // we don't use since we can't easily destructure here):
      environmentMap = await environmentMapLoads;
      skybox = await skyboxLoads;

      if (!!skyboxUrl) {
        if (targetCache.has(skyboxUrl)) {
          skybox = targetCache.get(skyboxUrl)!;
        } else {
          targetCache.set(skyboxUrl, skybox!);
        }
      }

      if (environmentMapUrl == null) {
        if (skybox != null) {
          // Infer the environment from the skybox if we have one:
          environmentMapUrl = skyboxUrl + ':env';
          environmentMap = skybox;
        } else {
          // Otherwise, no skybox URL was specified, so fall back to
          // generating the environment:
          environmentMapUrl = 'generated:env';
          if (!targetCache.has(environmentMapUrl)) {
            this.environmentMapGenerator =
                new EnvironmentMapGenerator(this.renderer);
            environmentMap = this.environmentMapGenerator.generate();
            this.gaussianBlur(environmentMap);
            environmentMapWasGenerated = true;
          }
        }
      } else {
        environmentMapUrl = environmentMapUrl + ':env';
      }

      // Apply the PMREM pass to the environment, which produces a distinct
      // texture from the source:
      if (targetCache.has(environmentMapUrl)) {
        environmentMap = targetCache.get(environmentMapUrl)!;
      } else {
        const nonPmremEnvironmentMap = environmentMap!.texture;
        environmentMap = this.pmremPass(nonPmremEnvironmentMap);
        targetCache.set(environmentMapUrl, environmentMap);

        // If the source was generated, then we should dispose of it right away
        if (environmentMapWasGenerated) {
          nonPmremEnvironmentMap.dispose();
        }
      }

      return {environmentMap, skybox};
    } catch (error) {
      if (skybox != null) {
        (skybox as any).dispose();
      }

      if (environmentMap != null) {
        (environmentMap as any).dispose();
      }

      throw error;
    } finally {
      updateGenerationProgress(1.0);
    }
  }

  gaussianBlur(
      cubeTarget: WebGLRenderTargetCube,
      standardDeviationRadians: number = 0.04) {
    const blurScene = new Scene();

    const geometry = new BoxBufferGeometry();
    geometry.removeAttribute('uv');

    const cubeResolution = cubeTarget.width;
    const standardDeviations = 3;
    const n = Math.ceil(
        standardDeviations * standardDeviationRadians * cubeResolution * 2 /
        Math.PI);
    const norm = standardDeviations / ((n - 1) * Math.sqrt(2 * Math.PI));
    let weights = [];
    for (let i = 0; i < n; ++i) {
      const x = standardDeviations * i / (n - 1);
      weights.push(norm * Math.exp(-x * x / 2));
    }

    const blurMaterial = new ShaderMaterial({
      uniforms: {
        tCube: {value: null},
        latitudinal: {value: false},
        weights: {value: weights},
        dTheta: {value: standardDeviationRadians * standardDeviations / (n - 1)}
      },
      vertexShader: `
        varying vec3 vWorldDirection;
        #include <common>
        void main() {
          vWorldDirection = transformDirection( position, modelMatrix );
          #include <begin_vertex>
          #include <project_vertex>
          gl_Position.z = gl_Position.w;
        }
      `,
      fragmentShader: [
        'const float n = ' + n + '.0;',
        'uniform float weights[' + n + '];',
        `
        uniform samplerCube tCube;
        uniform bool latitudinal;
        uniform float dTheta;
        varying vec3 vWorldDirection;
        void main() {
          vec4 texColor = vec4(0.0);
          for (float i = 1.0 - n; i < n; i++) {
            vec3 sampleDirection = vWorldDirection;
            float xz = length(sampleDirection.xz);
            float weight = weights[int(abs(i))];
            if (latitudinal) {
              float diTheta = dTheta * i / xz;
              mat2 R = mat2(cos(diTheta), sin(diTheta), -sin(diTheta), cos(diTheta));
              sampleDirection.xz = R * sampleDirection.xz;
              texColor += weight * RGBEToLinear(textureCube(tCube, sampleDirection));
            } else {
              float diTheta = dTheta * i;
              mat2 R = mat2(cos(diTheta), sin(diTheta), -sin(diTheta), cos(diTheta));
              vec2 xzY = R * vec2(xz, sampleDirection.y);
              sampleDirection.xz *= xzY.x / xz;
              sampleDirection.y = xzY.y;
              texColor += weight * RGBEToLinear(textureCube(tCube, sampleDirection));
            }
          }
          gl_FragColor = linearToOutputTexel(texColor);
        }
      `
      ].join('\n'),
      side: BackSide,
      depthTest: false,
      depthWrite: false
    });

    blurScene.add(new Mesh(geometry, blurMaterial));

    const blurCamera = new CubeCamera(0.1, 100, cubeResolution);
    const tempTarget = blurCamera.renderTarget;
    tempTarget.texture.type = UnsignedByteType;
    tempTarget.texture.format = RGBEFormat;
    tempTarget.texture.encoding = RGBEEncoding;
    tempTarget.texture.magFilter = NearestFilter;
    tempTarget.texture.minFilter = NearestFilter;
    tempTarget.texture.generateMipmaps = false;

    var gammaOutput = this.renderer.gammaOutput;
    var toneMapping = this.renderer.toneMapping;
    var toneMappingExposure = this.renderer.toneMappingExposure;

    this.renderer.toneMapping = LinearToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.gammaOutput = false;

    blurMaterial.uniforms.latitudinal.value = false;
    blurMaterial.uniforms.tCube.value = cubeTarget.texture;
    blurCamera.update(this.renderer, blurScene);

    blurMaterial.uniforms.latitudinal.value = true;
    blurMaterial.uniforms.tCube.value = tempTarget.texture;
    blurCamera.renderTarget = cubeTarget;
    blurCamera.update(this.renderer, blurScene);

    this.renderer.toneMapping = toneMapping;
    this.renderer.toneMappingExposure = toneMappingExposure;
    this.renderer.gammaOutput = gammaOutput;

    tempTarget.dispose();
  }

  /**
   * Takes a cube-ish (@see equirectangularToCubemap) texture and
   * returns a texture of the prefiltered mipmapped radiance environment map
   * to be used as environment maps in models.
   */
  pmremPass(texture: Texture, samples?: number, size?: number):
      WebGLRenderTarget {
    const generator = new PMREMGenerator(texture, samples, size);
    generator.update(this.renderer);

    const packer = new PMREMCubeUVPacker(generator.cubeLods);
    packer.update(this.renderer);

    const renderTarget = packer.CubeUVRenderTarget;

    generator.dispose();
    packer.dispose();

    (renderTarget.texture as any).userData = {
      ...userData,
      ...({
        url: (texture as any).userData ? (texture as any).userData.url : null,
        mapping: 'PMREM',
      })
    };

    return renderTarget;
  }

  dispose() {
    // NOTE(cdata): In the case that the generators are invoked with
    // an incorrect texture, the generators will throw when we attempt to
    // dispose of them because the framebuffer has not been created yet but
    // the implementation does not guard for this correctly:
    try {
      if (this.environmentMapGenerator != null) {
        this.environmentMapGenerator.dispose();
        (this as any).environmentMapGenerator = null;
      }
    } catch (_error) {
    }
  }
}
