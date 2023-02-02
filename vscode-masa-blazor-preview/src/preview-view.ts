import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ApiService } from "./service";

export class RazorPreviewView {
    public constructor(private context: vscode.ExtensionContext) { }

    private singlePreviewPanel: vscode.WebviewPanel | null = null;
    private singlePreviewPanelSourceTargetUri: vscode.Uri | null = null;

    private apiService?: ApiService;

    private panel2EditorMap: Map<vscode.WebviewPanel, vscode.TextEditor> = new Map();

    private formatPathIfNecessary(pathString: string) {
        if (process.platform === "win32") {
            pathString = pathString.replace(
                /^([a-zA-Z])\:\\/,
                (_, $1) => `${$1.toUpperCase()}:\\`
            );
        }
        return pathString;
    }

    private getProjectDirectoryPath(
        sourceUri: vscode.Uri,
        workspaceFolders: readonly vscode.WorkspaceFolder[] = []
    ) {
        const possibleWorkspaceFolders = workspaceFolders.filter(
            (workspaceFolder) => {
                return (
                    path
                        .dirname(sourceUri.path.toUpperCase())
                        .indexOf(workspaceFolder.uri.path.toUpperCase()) >= 0
                );
            }
        );

        let projectDirectoryPath;

        if (possibleWorkspaceFolders.length) {
            const workspaceFolder = possibleWorkspaceFolders.sort(
                (x, y) => y.uri.path.length - x.uri.path.length
            )[0];

            projectDirectoryPath = workspaceFolder.uri.fsPath;
        } else {
            projectDirectoryPath = "";
        }

        return this.formatPathIfNecessary(projectDirectoryPath);
    }

    public getFilePath(sourceUri: vscode.Uri) {
        return this.formatPathIfNecessary(sourceUri.fsPath);
    }

    public async init(
        sourceUri: vscode.Uri,
        ediitor: vscode.TextEditor,
        viewOptions: { viewColumn: vscode.ViewColumn; preserveFocus?: boolean }
    ) {
        let previewPanel: vscode.WebviewPanel;

        const baseUrl = "http://localhost:5000/";

        if (!this.apiService) {

            this.apiService = new ApiService({
                baseUrl: baseUrl
            }, { handle() { } });
        }

        // const oldResourceRoot =
        //     this.getProjectDirectoryPath(
        //         this.singlePreviewPanelSourceTargetUri!,
        //         vscode.workspace.workspaceFolders
        //     ) || path.dirname(this.singlePreviewPanelSourceTargetUri!.fsPath);

        // const newResourceRoot =
        //     this.getProjectDirectoryPath(
        //         sourceUri,
        //         vscode.workspace.workspaceFolders
        //     ) || path.dirname(sourceUri.fsPath);

        if (!this.singlePreviewPanel) {
            const localResourceRoots = [
                vscode.Uri.file(this.context.extensionPath),
                vscode.Uri.file(
                    this.getProjectDirectoryPath(
                        sourceUri,
                        vscode.workspace.workspaceFolders
                    ) || path.dirname(sourceUri.fsPath)
                ),
            ];

            previewPanel = vscode.window.createWebviewPanel(
                "razor-preview",
                `Preview ${path.basename(sourceUri.fsPath)}`,
                viewOptions,
                {
                    enableScripts: true,
                    enableFindWidget: true,
                    localResourceRoots,
                }
            );

            previewPanel.webview.onDidReceiveMessage(
                (message) => { },
                null,
                this.context.subscriptions
            );

            previewPanel.onDidDispose(() => {

                this.singlePreviewPanel = null;
                this.singlePreviewPanelSourceTargetUri = null;

            }, null, this.context.subscriptions);

            this.singlePreviewPanel = previewPanel;
            this.panel2EditorMap.set(previewPanel, ediitor);

            this.singlePreviewPanel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                
                <head>
                    <meta charset="utf-8" />
                    <title>DynamicRazorRender.WebAssembly</title>
                    <base href="/" />
                            
                    <style>
                        .hide {
                            display: none;
                        }

                        body { background-color: white; }
                    </style>
                </head>
                
                <body>
                
                    <div id="app">
                        <iframe style="width: 100%; height: 100vh;" src="${baseUrl}"></iframe>
                    </div>
                            
                </body>
                
                </html>
                `;
        }
        else {
            this.singlePreviewPanel.reveal(viewOptions.viewColumn, true);
        }

        this.singlePreviewPanel.title = `预览 ${path.basename(sourceUri.fsPath)}`;

        this.apiService?.renderFileAsync({
            filePath: sourceUri.fsPath
        });
    }
}
