/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
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
 *
 */

import {MaterialPanel} from '../../components/materials_panel/materials_panel.js';
import {ModelViewerPreview} from '../../components/model_viewer_preview/model_viewer_preview.js';
import {dispatchGltfUrl, getTextureId} from '../../components/model_viewer_preview/reducer.js';
import {Dropdown} from '../../components/shared/dropdown/dropdown.js';
import {SliderWithInputElement} from '../../components/shared/slider_with_input/slider_with_input.js';
import {dispatchReset} from '../../reducers.js';
import {reduxStore} from '../../space_opera_base.js';

const CUBE_GLTF_PATH = '../base/shared-assets/models/cube.gltf';

describe('material panel test', () => {
  let preview: ModelViewerPreview;
  let panel: MaterialPanel;

  beforeEach(async () => {
    reduxStore.dispatch(dispatchReset());
    preview = new ModelViewerPreview();
    document.body.appendChild(preview);
    await preview.updateComplete;

    panel = new MaterialPanel();
    panel.isTesting = true;
    document.body.appendChild(panel);

    reduxStore.dispatch(dispatchGltfUrl(CUBE_GLTF_PATH));
    await preview.loadComplete;
    await panel.updateComplete;
  });

  afterEach(() => {
    document.body.removeChild(preview);
    document.body.removeChild(panel);
  });

  it('selector reflects materials in GLTF', async () => {
    panel.selectedMaterialIndex = 0;
    await panel.updateComplete;
    expect(panel.selectedBaseColor).toEqual([0.8, 0.8, 0.2, 1.0]);
    expect(panel.selectedRoughnessFactor).toEqual(0.9);
    expect(panel.selectedMetallicFactor).toEqual(0.4);
  });

  it('material edits where roughness and metallic factors are initially undefined works',
     async () => {});

  it('should reuse textures when applying edits to the same model',
     async () => {});

  it('reflects textures in GLTF', async () => {
    panel.selectedMaterialIndex = 0;
    await panel.updateComplete;
    const firstUrl = panel.thumbnailUrls.values().next().value;
    expect(firstUrl).toBe('originalTexture.png');

    const texturePicker = panel.shadowRoot!.querySelector('me-texture-picker')!;
    await texturePicker.updateComplete;
    expect(texturePicker!.images.length).toBe(5);
  });

  // Input/click
  it('applies changes to model textures on base color texture picker input',
     async () => {
       panel.selectedMaterialIndex = 0;
       await panel.updateComplete;
       const texturePicker = panel.baseColorTexturePicker!;
       texturePicker.selectedIndex = 0;
       await texturePicker.updateComplete;

       const textureOptionInput =
           texturePicker.shadowRoot!.querySelector('input')!;
       textureOptionInput.dispatchEvent(new Event('click'));
       const expectedTextureId = panel.selectedBaseColorTextureId!;

       const {baseColorTexture} =
           panel.getMaterial(panel.selectedMaterialIndex)!.pbrMetallicRoughness;
       expect(getTextureId(baseColorTexture!.texture.source))
           .toEqual(expectedTextureId);
     });

  it('clears model textures on base color null texture input', async () => {
    panel.selectedMaterialIndex = 1;
    await panel.updateComplete;
    const texturePicker = panel.baseColorTexturePicker!;
    await texturePicker.updateComplete;

    const textureOptionInput =
        texturePicker.shadowRoot!.querySelector('div#nullTextureSquare')!;
    textureOptionInput.dispatchEvent(new Event('click'));

    const {baseColorTexture} =
        panel.getMaterial(panel.selectedMaterialIndex)!.pbrMetallicRoughness;
    expect(getTextureId(baseColorTexture!.texture.source)).toEqual('undefined');
  });

  it('applies changes to model textures on MR texture picker input',
     async () => {
       panel.selectedMaterialIndex = 0;
       await panel.updateComplete;
       const texturePicker = panel.metallicRoughnessTexturePicker!;
       texturePicker.selectedIndex = 1;
       await texturePicker.updateComplete;

       const textureOptionInput =
           texturePicker.shadowRoot!.querySelector('input')!;
       textureOptionInput.dispatchEvent(new Event('click'));
       const expectedTextureId = panel.selectedMetallicRoughnessTextureId!;

       const {metallicRoughnessTexture} =
           panel.getMaterial(panel.selectedMaterialIndex)!.pbrMetallicRoughness;
       expect(getTextureId(metallicRoughnessTexture!.texture.source))
           .toEqual(expectedTextureId);
     });

  it('clears model textures on MR null texture input', async () => {
    panel.selectedMaterialIndex = 1;
    await panel.updateComplete;
    const texturePicker = panel.metallicRoughnessTexturePicker!;
    await texturePicker.updateComplete;

    const clearTextureOption =
        texturePicker.shadowRoot!.querySelector('div#nullTextureSquare')!;
    clearTextureOption.dispatchEvent(new Event('click'));

    const {metallicRoughnessTexture} =
        panel.getMaterial(panel.selectedMaterialIndex)!.pbrMetallicRoughness;
    expect(getTextureId(metallicRoughnessTexture!.texture.source))
        .toEqual('undefined');
  });

  it('applies changes to model textures on normal texture picker input',
     async () => {
       panel.selectedMaterialIndex = 0;
       await panel.updateComplete;
       const texturePicker = panel.normalTexturePicker!;
       texturePicker.selectedIndex = 2;
       await texturePicker.updateComplete;

       const textureOptionInput =
           texturePicker.shadowRoot!.querySelector('input')!;
       textureOptionInput.dispatchEvent(new Event('click'));
       const expectedTextureId = panel.selectedNormalTextureId!;

       const {normalTexture} = panel.getMaterial(panel.selectedMaterialIndex)!;
       expect(getTextureId(normalTexture!.texture.source))
           .toEqual(expectedTextureId);
     });

  it('clears model textures on normal null texture input', async () => {
    panel.selectedMaterialIndex = 1;
    await panel.updateComplete;
    const texturePicker = panel.normalTexturePicker!;
    await texturePicker.updateComplete;

    const clearTextureOption =
        texturePicker.shadowRoot!.querySelector('div#nullTextureSquare')!;
    clearTextureOption.dispatchEvent(new Event('click'));

    const {normalTexture} = panel.getMaterial(panel.selectedMaterialIndex)!;
    expect(getTextureId(normalTexture!.texture.source)).toEqual('undefined');
  });

  it('applies changes to model textures on emissive texture picker input',
     async () => {
       panel.selectedMaterialIndex = 0;
       await panel.updateComplete;
       const texturePicker = panel.emissiveTexturePicker!;
       texturePicker.selectedIndex = 2;
       await texturePicker.updateComplete;

       const textureOptionInput =
           texturePicker.shadowRoot!.querySelector('input')!;
       textureOptionInput.dispatchEvent(new Event('click'));
       const expectedTextureId = panel.selectedEmissiveTextureId!;

       const {emissiveTexture} =
           panel.getMaterial(panel.selectedMaterialIndex)!;
       expect(getTextureId(emissiveTexture!.texture.source))
           .toEqual(expectedTextureId);
     });

  it('clears model textures on emissive null texture input', async () => {
    panel.selectedMaterialIndex = 1;
    await panel.updateComplete;
    const texturePicker = panel.emissiveTexturePicker!;
    await texturePicker.updateComplete;

    const clearTextureOption =
        texturePicker.shadowRoot!.querySelector('div#nullTextureSquare')!;
    clearTextureOption.dispatchEvent(new Event('click'));

    const {emissiveTexture} = panel.getMaterial(panel.selectedMaterialIndex)!;
    expect(getTextureId(emissiveTexture!.texture.source)).toEqual('undefined');
  });

  it('applies changes to model textures on occlusion texture picker input',
     async () => {
       panel.selectedMaterialIndex = 0;
       await panel.updateComplete;
       const texturePicker = panel.occlusionTexturePicker!;
       texturePicker.selectedIndex = 2;
       await texturePicker.updateComplete;

       const textureOptionInput =
           texturePicker.shadowRoot!.querySelector('input')!;
       textureOptionInput.dispatchEvent(new Event('click'));
       const expectedTextureId = panel.selectedOcclusionTextureId!;

       const {occlusionTexture} =
           panel.getMaterial(panel.selectedMaterialIndex)!;
       expect(getTextureId(occlusionTexture!.texture.source))
           .toEqual(expectedTextureId);
     });

  it('clears model textures on occlusion null texture input', async () => {
    panel.selectedMaterialIndex = 1;
    await panel.updateComplete;
    const texturePicker = panel.occlusionTexturePicker!;
    await texturePicker.updateComplete;

    const clearTextureOption =
        texturePicker.shadowRoot!.querySelector('div#nullTextureSquare')!;
    clearTextureOption.dispatchEvent(new Event('click'));

    const {occlusionTexture} = panel.getMaterial(panel.selectedMaterialIndex)!;
    expect(getTextureId(occlusionTexture!.texture.source)).toEqual('undefined');
  });

  it('applies changes to model textures on double sided change', async () => {
    panel.selectedMaterialIndex = 0;
    await panel.updateComplete;
    const doubleSidedCheckbox =
        panel.shadowRoot!.querySelector('me-checkbox#doubleSidedCheckbox') as
        HTMLInputElement;
    expect(doubleSidedCheckbox.checked).toBeFalse();

    doubleSidedCheckbox.checked = true;
    doubleSidedCheckbox.dispatchEvent(new Event('change'));

    expect(false).toEqual(true);
  });

  // Upload
  it('adds a base color texture to model textures on base color texture upload',
     async () => {
       panel.selectedMaterialIndex = 0;

       await panel.updateComplete;
       const texturePicker = panel.baseColorTexturePicker!;
       texturePicker.dispatchEvent(
           new CustomEvent('texture-uploaded', {detail: 'fooUrl'}));
       await panel.updateComplete;

       // Check that the uri of the texture at material 0 is the newly uploaded
       // texture.
       const {baseColorTexture} =
           panel.getMaterial(panel.selectedMaterialIndex)!.pbrMetallicRoughness;
       expect(getTextureId(baseColorTexture!.texture.source)).toEqual('fooUrl');
     });

  it('adds a normal texture to model textures on normal texture upload',
     async () => {
       panel.selectedMaterialIndex = 0;

       await panel.updateComplete;
       const texturePicker = panel.normalTexturePicker!;
       texturePicker.dispatchEvent(
           new CustomEvent('texture-uploaded', {detail: 'fooUrl'}));
       await panel.updateComplete;

       // Check that the uri of the texture at material 0 is the newly uploaded
       // texture.
       const {normalTexture} = panel.getMaterial(panel.selectedMaterialIndex)!;
       expect(getTextureId(normalTexture!.texture.source)).toEqual('fooUrl');
     });

  it('adds a metallic-roughness texture to model textures on MR texture upload',
     async () => {
       panel.selectedMaterialIndex = 0;

       await panel.updateComplete;
       const texturePicker = panel.metallicRoughnessTexturePicker!;
       texturePicker.dispatchEvent(
           new CustomEvent('texture-uploaded', {detail: 'fooUrl'}));
       await panel.updateComplete;

       // Check that the uri of the texture at material 0 is the newly uploaded
       // texture.
       const {metallicRoughnessTexture} =
           panel.getMaterial(panel.selectedMaterialIndex)!.pbrMetallicRoughness;
       expect(getTextureId(metallicRoughnessTexture!.texture.source))
           .toEqual('fooUrl');
     });

  it('adds a emissive texture to model textures on emissive texture upload',
     async () => {
       panel.selectedMaterialIndex = 0;

       await panel.updateComplete;
       const texturePicker = panel.emissiveTexturePicker!;
       texturePicker.dispatchEvent(
           new CustomEvent('texture-uploaded', {detail: 'fooUrl'}));
       await panel.updateComplete;

       // Check that the uri of the texture at material 0 is the newly uploaded
       // texture.
       const {emissiveTexture} =
           panel.getMaterial(panel.selectedMaterialIndex)!;
       expect(getTextureId(emissiveTexture!.texture.source)).toEqual('fooUrl');
     });

  it('adds a occlusion texture to model textures on occlusion texture upload',
     async () => {
       panel.selectedMaterialIndex = 0;

       await panel.updateComplete;
       const texturePicker = panel.occlusionTexturePicker!;
       texturePicker.dispatchEvent(
           new CustomEvent('texture-uploaded', {detail: 'fooUrl'}));
       await panel.updateComplete;

       // Check that the uri of the texture at material 0 is the newly uploaded
       // texture.
       const {occlusionTexture} =
           panel.getMaterial(panel.selectedMaterialIndex)!;
       expect(getTextureId(occlusionTexture!.texture.source)).toEqual('fooUrl');
     });

  it('applies changes to model textures on emissiveFactor change', async () => {
    panel.selectedMaterialIndex = 0;
    await panel.updateComplete;

    panel.emissiveFactorPicker.selectedColorHex = '#ff0000';
    panel.emissiveFactorPicker.dispatchEvent(new Event('change'));

    const {emissiveFactor} = panel.getMaterial(panel.selectedMaterialIndex)!;
    expect(emissiveFactor).toEqual([1, 0, 0]);
  });

  it('applies changes to model textures on alpha mode change', async () => {
    panel.selectedMaterialIndex = 0;
    await panel.updateComplete;

    const dropdown = panel.shadowRoot!.querySelector(
                         'me-dropdown#alpha-mode-picker') as Dropdown;
    expect(dropdown.selectedItem.getAttribute('value')).toBe('OPAQUE');
    const maskItem =
        dropdown.querySelector('paper-item[value="MASK"]') as HTMLElement;
    maskItem.click();
    expect(false).toEqual(true);
  });

  it('applies changes to model textures on alpha cutoff change', async () => {
    panel.selectedMaterialIndex = 0;
    await panel.updateComplete;

    const dropdown = panel.shadowRoot!.querySelector(
                         'me-dropdown#alpha-mode-picker') as Dropdown;

    const opaqueItem =
        dropdown.querySelector('paper-item[value="OPAQUE"]') as HTMLElement;
    opaqueItem.click();

    await panel.updateComplete;

    // Alpha cutoff should not be present on 'OPAQUE' alpha mode
    expect(panel.shadowRoot!.querySelector('me-slider-with-input#alpha-cutoff'))
        .toBe(null);

    const maskItem =
        dropdown.querySelector('paper-item[value="MASK"]') as HTMLElement;
    maskItem.click();

    await panel.updateComplete;

    const alphaCutoffSlider =
        panel.shadowRoot!.querySelector('me-slider-with-input#alpha-cutoff') as
        SliderWithInputElement;
    expect(alphaCutoffSlider).toBeDefined();
    expect(alphaCutoffSlider.value).toBe(0.5);

    alphaCutoffSlider.value = 1;
    alphaCutoffSlider.dispatchEvent(new Event('change'));

    expect(0).toEqual(1);
  });
});
