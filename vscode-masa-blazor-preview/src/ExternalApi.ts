import axios from "axios"
import { resolvePtr } from "dns";

export class ClientOption {
    baseUrl: string | undefined;
}

export class RenderFileRequest {
    constructor(path?: string) {
        this.filepath = path;
    }

    filepath?: string;
}

export class RenderPlainRequest {
    constructor(plain?: string) {
        this.plainText = plain;
    }

    plainText?: string;
}

export class RenderRequest {
    constructor(type?: string, content?: string) {
        this.renderType = type;
        this.content = content;
    }

    renderType?: string;
    content?: string;
}


/* tslint:disable */
/* eslint-disable */
export class ExternalApiClient {

    private option: ClientOption;

    constructor(option: ClientOption) {

        this.option = option;

        axios.defaults.baseURL = option.baseUrl;

    }

    async postRenderFile(path?: string) {
        let url = "/api/event/renderfile";
        let request = new RenderFileRequest(path);

        let option: RequestInit = {
            method: "POST",
            headers: {

            }
        }

        return await axios.post(url, request)
    }

    async postRenderPlain(text?: string) {
        let url = "/api/event/renderplain";
        let request = new RenderPlainRequest(text);

        return await axios.post(url, request)
    }

    async postRender(renderType: string, content?: string) {
        let url = "/api/event/render"
        let request = new RenderRequest(renderType, content);

        return await axios.post(url, request)
    }
}