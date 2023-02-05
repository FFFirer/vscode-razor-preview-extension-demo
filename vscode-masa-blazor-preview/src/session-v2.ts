import { MasaBlazorPreviewServiceProcess } from "./process-v2";
import { SessionStatus } from "./session";
import * as vscode from "vscode";
import { ILogger, Logger } from "./logging";
import * as path from "path";
import { defaultSetting, Setting } from "./setting";
import { ApiService } from "./service";

export class SessionManagerV2 {
    constructor(
        private extensionContext: vscode.ExtensionContext,
        private log: ILogger,
        private api: ApiService
    ) {
        
    }

    /**当前状态 */
    private sessionStatus: SessionStatus = SessionStatus.NeverStarted;

    private razorPreviewProcess?: MasaBlazorPreviewServiceProcess;

    private sessionSetting?: Setting;

    /**启动 */
    public start() {
        this.sessionSetting = Setting.load();

        // if (this.extensionContext.extensionMode === vscode.ExtensionMode.Development) {
        //     return;
        // }

        this.startProcess();
    }

    private startProcess() {
        this.razorPreviewProcess = new MasaBlazorPreviewServiceProcess(
            "Razor Preview Service",
            this.sessionSetting!.executableName!,
            this.sessionSetting!.startUrl!,
            path.resolve(__dirname, this.sessionSetting!.bundledServicePath!),
            this.log,
            this.api
        );

        this.razorPreviewProcess.onExited(
            () => {
                if (this.sessionStatus === SessionStatus.Running) {
                    this.sessionStatus = SessionStatus.Failed;
                    this.promptForRestart();
                }
            }
        )

        this.razorPreviewProcess
            .start()
            .then(
                (processStarted) => {
                    if (processStarted) {
                        this.log.write("Razor preview service startup success");
                        this.sessionStatus = SessionStatus.Running;
                    } else {
                        this.log.write("Razor preview service startup failed");
                        this.sessionStatus = SessionStatus.Failed;
                    }
                },
                (error: any) => {
                    this.sessionStatus = SessionStatus.Failed;
                    this.log.write("Razor preview service startup failed");
                    console.log("Razor preview service startup failed", error);
                    this.promptForRestart();
                }
            )
            .catch((error: any) => {
                this.sessionStatus = SessionStatus.Failed;
                this.log.write("Razor preview service startup failed");
                console.log("Razor preview service startup failed", error);
                this.promptForRestart();
            })
    }

    private promptForRestart() {
        vscode.window.showErrorMessage(
            "后台服务已经停止, 是否要重新启动",
            "Yes", "No")
            .then((answer) => {
                if (answer === "Yes") {
                    this.restart();
                }
            });
    }

    /**停止 */
    public stop() {
        if (this.sessionStatus == SessionStatus.Failed) {
            this.razorPreviewProcess = undefined;
        }

        this.sessionStatus = SessionStatus.Stopping;

        if (this.razorPreviewProcess != undefined) {
            this.razorPreviewProcess.stop();
            this.razorPreviewProcess = undefined;
        }

        this.sessionStatus = SessionStatus.NotStarted;
    }

    /**重启 */
    public restart() {
        this.stop();
        this.start();
    }

    /**资源释放 */
    public dispose() {
        this.stop();
    }
}