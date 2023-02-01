// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { RazorPreviewView } from './preview-view';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-masa-blazor-preview" is now active!');

	const view = new RazorPreviewView(context);

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
			viewColumn: vscode.ViewColumn.Two,
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
			viewColumn: vscode.ViewColumn.One,
			preserveFocus: false,
		});
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand(
		'vscode-masa-blazor-preview.renderDocument',
		openPreview
	);

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
