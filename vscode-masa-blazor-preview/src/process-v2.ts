import * as vscode from "vscode";
import * as path from "path";
import { ILogger, Logger } from "./logging";
import { ApiService } from "./service";

export class MasaBlazorPreviewServiceProcess {
    public onExited : vscode.Event<void>
    private onExitedEmitter: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    
    private consoleTerminal?: vscode.Terminal;
    private consoleCloseSubscription?: vscode.Disposable;

    constructor(
        private title: string,
        private executableName: string,
        private startupUrl: string,
        private bundledServicePath: string,
        private log: ILogger,
        private api: ApiService
    ) {
        this.onExited = this.onExitedEmitter.event;
    }

    /**启动 */
    public async start() : Promise<boolean> {
        const executablePath = path.resolve(
            this.bundledServicePath,
            this.executableName
        )

        const cwd = path.resolve(
            this.bundledServicePath,
        )

        const startupArgs = []
        startupArgs.push(`--urls=${this.startupUrl}`)

        this.log.write(
            "Razor Preview Service is starting -- ",
            "    executable path: " + executablePath,
            "    args: " + startupArgs.join(" "),
        )

        // vscode.window.showInformationMessage(
        //     "正在启动服务"
        // );

        const terminalOptions: vscode.TerminalOptions = {
            name: this.title,
            shellPath: executablePath,
            shellArgs: startupArgs,
            cwd: cwd
        }

        this.consoleTerminal = vscode.window.createTerminal(terminalOptions);
        this.consoleTerminal.show(false);
        
        this.log.write("Razor Preview Service started");

        this.consoleCloseSubscription = vscode.window.onDidCloseTerminal(
            (terminal) => {
                // emit close console event
                this.onTerminalClose(terminal);
            }
        )

        const started = await this.waitForStarted(10);

        return started;
    }

    private async waitForStarted(retries: number) : Promise<boolean> {
        const _this = this;
        
        return new Promise((resolve, reject) => {
            function attempt() {
                _this.api.healthCheckAsync()
                .then(
                    () =>{
                        _this.log.write("Checked Razor Preview Service: Success");
                        resolve(true)
                    })
                .catch(
                    (error) => {
                        if(retries < 0){
                            _this.log.write("Checked Razor Preview Service: Failed");
                            reject(false);
                        }
                        else{
                            _this.log.write("Checking Razor Preview Service")
                            retries--;
                            setTimeout(attempt, 1000);
                        }
                    }
                )
            }
            attempt();
        })

        // try {
        //     await this.api.healthCheckAsync()
        //     this.log.write("Checked Razor Preview Service Status : Started");
        //     return true
        // }
        // catch(_)
        // {
        //     if(retries < 0){
        //         this.log.write("Checked Razor Preview Service Status : Failed");
        //         return false;
        //     }
        //     this.log.write("Checking Razor Preview Service Status : Checking");
        //     setTimeout(async () => {
        //         await this.waitForStarted(retries--)
        //     }, 1000);
        // }
        // return false;
    }

    private onTerminalClose(terminal: vscode.Terminal){
        if(terminal != this.consoleTerminal){
            return;
        }

        this.onExitedEmitter?.fire();
    }

    /**停止 */
    public stop() {
        if(this.consoleTerminal){
            this.consoleTerminal.dispose();
            this.consoleTerminal = undefined;
        }
    }

    /**重启 */
    // public restart() {

    // }

    /**资源释放 */
    public dispose() {
        if(this.consoleCloseSubscription){
            this.consoleCloseSubscription.dispose();
            this.consoleCloseSubscription = undefined;
        }

        if(this.consoleTerminal){
            this.consoleTerminal.dispose();
            this.consoleTerminal = undefined;
        }

        if(this.onExitedEmitter){
            this.onExitedEmitter.dispose();
        }
    }
}