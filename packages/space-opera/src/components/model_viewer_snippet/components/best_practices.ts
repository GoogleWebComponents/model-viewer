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

import {customElement, html, internalProperty, LitElement} from 'lit-element';

/**
 * A section of best practices to enable or disable.
 */
@customElement('best-practices')
export class BestPractices extends LitElement {
  @internalProperty() isUsingDefaultProgressBar = true;

  onProgressBarChange() {
  }

  render() {
    return html`
    <div>Todo</div>
    <me-checkbox 
            id="progress-bar" 
            label="Use Recommended Progress Bar"
            ?checked="${this.isUsingDefaultProgressBar}"
            @change=${this.onProgressBarChange}
            >
          </me-checkbox>
    <div style="margin-bottom: 50px;"></div>
    `;
  }
}


declare global {
  interface HTMLElementTagNameMap {
    'best-practices': BestPractices;
  }
}
