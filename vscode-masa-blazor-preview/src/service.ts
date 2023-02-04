import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";

export class ApiConfigOption {
    baseUrl?: string;
}

export class RenderRequest {
    renderType?: string;
    content?: string;
}

export class RenderFileRequest {
    filePath?: string;
}

export class RenderPlainRequest {
    plainText?: string;
}

export interface IErrorHanlder {
    handle(error: any): void;
}


export class ApiService {
    constructor(option: ApiConfigOption, errorHandler?: IErrorHanlder) {
        this.option = option;

        this.instance = axios.create({
            baseURL: option.baseUrl!
        });

        this.instance.interceptors.response.use(
            (response) => {
                // TODO
                if (response.status === 200) {
                    return Promise.resolve(response);
                }
                else {
                    return Promise.reject(response);
                }
            },
            (error) => {
                // TODO
                this.errorHandler?.handle(JSON.stringify(error))

                return Promise.reject(error)
            }
        )

        this.errorHandler = errorHandler;
    }

    private instance: AxiosInstance;
    private errorHandler?: IErrorHanlder;
    public option: ApiConfigOption;

    private handleResponse(response: Promise<AxiosResponse<any, any>>): Promise<any> {
       
        return new Promise((resolve, reject) => {
            response
                .then(resp => resolve(resp.data))
                .catch(error => {
                    console.log(error); 
                    reject(error);
                });
        });
    }

    public async renderAsync(requset: RenderRequest): Promise<any> {
        const url = "/api/event/render";

        return this.handleResponse(this.instance.post(url, requset));
    }

    public renderFileAsync(request: RenderFileRequest): Promise<any> {
        const url = "/api/event/renderFile";

        return this.handleResponse(this.instance.post(url, request));
    }

    public renderPlainAsync(request: RenderPlainRequest): Promise<any> {
        const url = "/api/event/renderPlain";

        return this.handleResponse(this.instance.post(url, request));
    }

    public healthCheckAsync() : Promise<void> {
        const url = "/api/health/check";

        return this.handleResponse(this.instance.get(url));
    }
}