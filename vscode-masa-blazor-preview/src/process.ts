import path = require("path")
import * as vscode from "vscode"
import * as semver from "semver"
import { ILogger } from "./logging";

export class PreviewRazorServiceProcess {

    private consoleTerminal?: vscode.Terminal;
    private consoleCloseSubscription?: vscode.Disposable;

    public onExited?: vscode.Event<void>;
    private onExitedEmitter = new vscode.EventEmitter<void>();

    constructor(
        /**标题 */
        private title: string,
        /**执行命令的shell路径 */
        private exePath: string,
        /**service启动监听的url */
        private url: string,
        /**service的启动路径 */
        private bundledServicePath: string,
        private log: ILogger,
        /**工作目录 */
        private cwd?: string
    ) {
        this.onExited = this.onExitedEmitter.event;
    }

    public async start() {
        const servicePath = path.resolve(__dirname, this.bundledServicePath, "DynamicRazorRender.Server.exe");

        const startPreviewRazorService = "" + servicePath + "DynamicRazorRender.Server.exe";

        const shellArgs = [];

        shellArgs.push(`--urls=${this.url}`)

        const terminalOptions: vscode.TerminalOptions = {
            name: this.title,
            shellPath: servicePath,
            shellArgs: shellArgs,
            cwd: this.cwd,
        }

        if (semver.gte(vscode.version, "1.65.0")) {
            terminalOptions.isTransient = true;
        }

        this.consoleTerminal = vscode.window.createTerminal(terminalOptions);
        this.consoleTerminal.show(true);

        this.consoleCloseSubscription = vscode.window.onDidCloseTerminal(
            (terminal) => {
                this.onTerminalClose(terminal);
            }
        )

        this.consoleTerminal.processId.then((pid) => { });
    }

    public showConsole(preserveFocus: boolean) {
        if (this.consoleTerminal) {
            this.consoleTerminal.show(true);
        }
    }

    public dispose()
    {
        if(this.consoleCloseSubscription){
            this.consoleCloseSubscription.dispose();
            this.consoleCloseSubscription = undefined;
        }

        if(this.consoleTerminal){
            this.consoleTerminal.dispose();
            this.consoleTerminal = undefined;
        }
    }



    private async onTerminalClose(terminal: vscode.Terminal) {
        if (terminal != this.consoleTerminal) {
            return;
        }
    }
}