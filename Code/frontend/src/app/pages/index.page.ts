import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <div class="p-4 bg-blue-100 text-blue-800">Tailwind funciona</div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .read-the-docs > * {
      color: red;
    }

    @media (prefers-color-scheme: light) {
      .read-the-docs > * {
        color: #213547;
      }
    }
  `,
})
export default class Home {}
