"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorPreviewView = void 0;
const vscode = require("vscode");
const path = require("path");
class RazorPreviewView {
    constructor(context) {
        this.context = context;
        this.singlePreviewPanel = null;
        this.singlePreviewPanelSourceTargetUri = null;
        this.panel2EditorMap = new Map();
    }
    formatPathIfNecessary(pathString) {
        if (process.platform === "win32") {
            pathString = pathString.replace(/^([a-zA-Z])\:\\/, (_, $1) => `${$1.toUpperCase()}:\\`);
        }
        return pathString;
    }
    getProjectDirectoryPath(sourceUri, workspaceFolders = []) {
        const possibleWorkspaceFolders = workspaceFolders.filter((workspaceFolder) => {
            return (path
                .dirname(sourceUri.path.toUpperCase())
                .indexOf(workspaceFolder.uri.path.toUpperCase()) >= 0);
        });
        let projectDirectoryPath;
        if (possibleWorkspaceFolders.length) {
            const workspaceFolder = possibleWorkspaceFolders.sort((x, y) => y.uri.path.length - x.uri.path.length)[0];
            projectDirectoryPath = workspaceFolder.uri.fsPath;
        }
        else {
            projectDirectoryPath = "";
        }
        return this.formatPathIfNecessary(projectDirectoryPath);
    }
    getFilePath(sourceUri) {
        return this.formatPathIfNecessary(sourceUri.fsPath);
    }
    async init(sourceUri, ediitor, viewOptions) {
        let previewPanel;
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
                vscode.Uri.file(this.getProjectDirectoryPath(sourceUri, vscode.workspace.workspaceFolders) || path.dirname(sourceUri.fsPath)),
            ];
            previewPanel = vscode.window.createWebviewPanel("razor-preview", `Preview ${path.basename(sourceUri.fsPath)}`, viewOptions, {
                enableScripts: true,
                enableFindWidget: true,
                localResourceRoots,
            });
            previewPanel.webview.onDidReceiveMessage((message) => { }, null, this.context.subscriptions);
            previewPanel.onDidDispose(() => {
                this.singlePreviewPanel = null;
                this.singlePreviewPanelSourceTargetUri = null;
            }, null, this.context.subscriptions);
            this.singlePreviewPanel = previewPanel;
            this.panel2EditorMap.set(previewPanel, ediitor);
        }
        else {
            this.singlePreviewPanel.reveal(viewOptions.viewColumn, true);
        }
        this.singlePreviewPanel.title = `预览 ${path.basename(sourceUri.fsPath)}`;
        this.singlePreviewPanel.webview.html = `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="utf-8" />
            <title>DynamicRazorRender.WebAssembly</title>
            <base href="/" />
                    
            <style>
                .hide {
                    display: none;
                }
            </style>
        </head>
        
        <body>
        
            <div id="app">
                <h1>Hello World</h1>
            </div>
                    
        </body>
        
        </html>
        `;
    }
}
exports.RazorPreviewView = RazorPreviewView;
//# sourceMappingURL=preview-view.js.map