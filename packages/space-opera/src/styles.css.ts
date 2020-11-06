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

import {css, CSSResult} from 'lit-element';

export const cameraSettingsStyles: CSSResult = css`
.SaveCameraButton,
me-camera-orbit-editor,
me-camera-target-input {
  margin-top: 10px;
}

.note {
  color: black;
  margin-left: 15px;
}
`;

export const fileModalStyles: CSSResult = css`
input[type="file"] {
  display: none;
}
`;

export const homeStyles: CSSResult = css`
.HomeCardHeader {
  font-size: 20px;
  color: black;
}

.HomeCardContent {
  font-size: 14px;
  color: #5F5F5F;
}

.CardContainer {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  color: rgba(0,0,0,.87);
}

.CardContent{
  display: flex;
  align-items: center;
}

img {
  padding-right: 10px;
}

.text {
  display: inline-block;
}

.note {
  color: black;
}
`;

export const hotspotEditorStyles: CSSResult = css`
textarea {
  outline: none;
  resize: vertical;
  width: 100%;
}
`;

export const iblSelectorStyles: CSSResult = css`
.defaultError {
  margin-top: 0;
  margin-left: 15px;
  color: black;
}
`;

export const posterControlsStyles: CSSResult = css`
.PosterButton {
  margin-bottom: 10px;
  display: block;
}

mwc-button {
  --mdc-button-disabled-fill-color: #ddd;
  --mdc-button-disabled-ink-color: #fff;
  width: 180px;
}
`;

export const modelViewerPreviewStyles: CSSResult = css`
model-viewer {
  cursor: -webkit-grab;
  cursor: -moz-grab;
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
  user-select: none;
  width: 100%;
}

.ScreenShotButton {
  border-radius: 50%;
  border: 1px #4285f4 solid;
  bottom: 25px;
  color: #4285f4; /* MATERIAL_COLOR_GOOGLE_BLUE_500 */;
  position: absolute;
  right: 25px;
}

.HelpText {
  font-family: Roboto;
  font-size: 20pt;
  text-align: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.HelpText small {
  font-size: 12pt;
}

.ErrorText {
  font-family: Roboto;
  color: darkred;
  font-size: 20pt;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
`;
