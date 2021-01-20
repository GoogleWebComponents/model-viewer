/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
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

import {customElement, html, LitElement} from 'lit-element';
import {styles} from './styles.css.js';

/**
 * An expandable tab with a label and an arrow icon indicating its expanded
 * state.
 */
@customElement('mv-link')
export class MVLink extends LitElement {
  static styles = styles;

  render() {
    return html`
<div class="outer-container">
  <a href="https://modelviewer.dev/" target="_blank" class="inner-container">
    <div class="icon-button"></div>
    <div class="attribute">&lt;model-viewer&gt;</div>
  </a>
</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mv-link': MVLink;
  }
}
