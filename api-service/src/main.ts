import './style.css'

import { ApiService, IErrorHanlder } from './service'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div>
      <input type='text' id='baseUrl' style='width: 300px;'></input>
      <button type='button' id='btnReload'>Reload Service</button>
    </div>
    <div>
      <textarea id='request' class='textarea'></textarea>
    </div>
    <div>
      <textarea id='response' class='textarea'></textarea>
    </div>
    <div>
      <button type='button' id='btnRenderPlain'>Render Plain</button>
      <button type='button' id='btnRenderFile'>Render File</button>
    </div>
  </div>
`

let service: ApiService | undefined;

class AErrorHandler implements IErrorHanlder {
  constructor(output: HTMLElement | null) {
    this.outputEl = output;
  }

  private outputEl: HTMLElement | null

  handle(error: any): void {
    if (this.outputEl && this.outputEl instanceof HTMLTextAreaElement) {
      (this.outputEl as HTMLTextAreaElement).value = JSON.stringify(error);
    }
  }
}

document.querySelector<HTMLInputElement>("#baseUrl")!.value = "/proxy";

document.querySelector<HTMLButtonElement>("#btnReload")?.addEventListener("click", (e) => {
  const baseUrl = document.querySelector<HTMLInputElement>("#baseUrl")?.value;
  service = new ApiService({
    baseUrl: baseUrl
  }, new AErrorHandler(document.querySelector<HTMLTextAreaElement>("#response")))

  const textarea = document.querySelector<HTMLTextAreaElement>("#response")
  if (textarea) {
    textarea.value = "reload service success"
  }
})

document.querySelector<HTMLButtonElement>("#btnRenderFile")?.addEventListener("click", (e) => {
  if (!service) {
    alert("请先Reload Service");
    return;
  }

  service.renderFileAsync({
    filePath: document.querySelector<HTMLTextAreaElement>("#request")?.value
  }).then(() => {
    const textarea = document.querySelector<HTMLTextAreaElement>("#response")
    if (textarea) {
      textarea.value = "render file success"
    }
  })
})

document.querySelector<HTMLButtonElement>("#btnRenderPlain")?.addEventListener("click", (_) => {
  if (!service) {
    alert("请先Reload Service");
    return;
  }

  service.renderPlainAsync({
    content: document.querySelector<HTMLTextAreaElement>("#request")?.value
  }).then(() => {
    const textarea = document.querySelector<HTMLTextAreaElement>("#response")
    if (textarea) {
      textarea.value = "render plain success"
    }
  })
})
