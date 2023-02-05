import path = require("path");
import * as vscode from "vscode";
import { ILogger } from "./logging";
import { PreviewRazorServiceProcess } from "./process";

export enum SessionStatus {
    NeverStarted,
    NotStarted,
    Initializing,
    Running,
    Stopping,
    Failed,
}

export class SessionManager {
    constructor(
        context: vscode.ExtensionContext,
        private log: ILogger) {

    }

    private previewService?: PreviewRazorServiceProcess;
    private sessionStatus: SessionStatus = SessionStatus.NeverStarted;

    public start() {


        this.previewService = new PreviewRazorServiceProcess(
            "Preview Razor Service",
            "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
            "http://localhost:5000",
            "../modules/RazorPreviewService",
            this.log,
            path.resolve(__dirname, "../modules/RazorPreviewService")
        )

        this.previewService!.onExited!(
            () => {
                if (this.sessionStatus == SessionStatus.Running) {
                    this.promptForRestart();
                }
            }
        )

        this.previewService
            .start()
            .then(
                () => {
                    this.log.write(" Started Razor Preview Service")
                    this.sessionStatus = SessionStatus.Running;
                },
                (error) => {
                    this.log.writeError(" Razor Preview Service Got Error : ");
                    console.log("Error", error);
                    this.sessionStatus = SessionStatus.Failed;
                }
            )
            .catch((error) => {
                console.log("Error2", error);
                this.sessionStatus = SessionStatus.Failed;
            })
    }

    public stop() {
        this.log.write("Shutting down Razor Preview Service");

        if (this.sessionStatus == SessionStatus.Failed) {
            this.previewService = undefined;
        }

        this.sessionStatus = SessionStatus.Stopping;

        if (this.previewService != undefined) {
            this.previewService?.dispose();
        }

        this.sessionStatus = SessionStatus.NotStarted;
    }

    private promptForRestart() {
        vscode.window.showErrorMessage(
            "服务已停止, 请问要重启它吗?",
            "Yes", "No"
        ).then((answer) => {
            if (answer == "Yes") {
                this.restartSession();
            }
        })
    }

    public restartSession() {
        this.stop();
        this.start();
    }

    public checkRunning() {
        if (this.sessionStatus != SessionStatus.Running) {
            this.start();
        }
    }
}