// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ILogger, Logger } from './logging';
import { RazorPreviewView } from './preview-view';
import { ApiService } from './service';
import { SessionManager } from './session';

let logger: ILogger;
let sessionManager: SessionManager;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-masa-blazor-preview" is now active!');

	logger = new Logger();
	sessionManager = new SessionManager(context, logger);

	sessionManager.start();

	const view = new RazorPreviewView(context, new ApiService({
		baseUrl: "http://localhost:5000/"
	}));


	/**
	 * open
	 */
	function openPreviewToTheSide(uri?: vscode.Uri) {
		let resource = uri;
		if (!(resource instanceof vscode.Uri)) {
			if (vscode.window.activeTextEditor) {
				// we are relaxed and don't check for markdown files
				resource = vscode.window.activeTextEditor.document.uri;
			}
		}
		view.init(resource!, vscode.window.activeTextEditor!, {
			viewColumn: vscode.ViewColumn.One,
			preserveFocus: true,
		});
	}

	function openPreview(uri?: vscode.Uri) {
		let resource = uri;
		if (!(resource instanceof vscode.Uri)) {
			if (vscode.window.activeTextEditor) {
				// we are relaxed and don't check for markdown files
				resource = vscode.window.activeTextEditor.document.uri;
			}
		}

		view.init(resource!, vscode.window.activeTextEditor!, {
			viewColumn: vscode.ViewColumn.Two,
			preserveFocus: true,
		});
	}

	function openPreviewFragment(uri?: vscode.Uri) {
		let resource = uri;

		if (!(resource instanceof vscode.Uri)) {
			if (vscode.window.activeTextEditor) {
				resource = vscode.window.activeTextEditor.document.uri;
			}
		}

		view.initSelection(resource!, vscode.window.activeTextEditor!, {
			viewColumn: vscode.ViewColumn.Two,
			preserveFocus: true
		})
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand(
		'vscode-masa-blazor-preview.renderDocument',
		openPreview
	);

	let command = vscode.commands.registerCommand(
		"vscode-masa-blazor-preview.renderFragment",
		openPreviewFragment
	);

	context.subscriptions.push(disposable);
	context.subscriptions.push(command);
}

// This method is called when your extension is deactivated
export function deactivate() { }
