// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ILogger, Logger } from './logging';
import { RazorPreviewView } from './preview-view';
import { ApiService } from './service';
import { SessionManager } from './session';
import { SessionManagerV2 } from './session-v2';
import { defaultSetting } from './setting';

let logger: ILogger;
let sessionManager: SessionManager;
let sessionManagerV2: SessionManagerV2;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-masa-blazor-preview" is now active!');

	logger = new Logger();

	const externalApi = new ApiService({
		baseUrl: defaultSetting.startupUrl
	})

	logger.write("external api service inited");

	// sessionManager = new SessionManager(context, logger);
	sessionManagerV2 = new SessionManagerV2(context, logger, externalApi)

	logger.write("session manager inited");

	const view = new RazorPreviewView(context, externalApi, sessionManagerV2, logger);
	
	logger.write("view manager inited");

	sessionManagerV2.start();

	logger.write("session manager started");

	function openPreview(uri?: vscode.Uri) {
		let resource = uri;
		let viewColumn = vscode.ViewColumn.Two;

		if (!(resource instanceof vscode.Uri)) {
			if (vscode.window.activeTextEditor) {
				resource = vscode.window.activeTextEditor.document.uri;
			}
		}

		view.init(
			resource!, 
			vscode.window.activeTextEditor!, 
			{
				viewColumn: viewColumn,
				preserveFocus: true,
			}
		);
	}

	function openPreviewFragment(uri?: vscode.Uri) {
		let resource = uri;
		let viewColumn = vscode.ViewColumn.Two;

		if (!(resource instanceof vscode.Uri)) {
			if (vscode.window.activeTextEditor) {
				resource = vscode.window.activeTextEditor.document.uri;
			}
		}

		view.initSelection(
			resource!, 
			vscode.window.activeTextEditor!, 
			{
				viewColumn: viewColumn,
				preserveFocus: true
			}
		);
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let previewDocumentCommand = vscode.commands.registerCommand(
		'vscode-masa-blazor-preview.previewDocument',
		openPreview
	);

	let previewFragmentCommand = vscode.commands.registerCommand(
		"vscode-masa-blazor-preview.previewFragment",
		openPreviewFragment
	);

	context.subscriptions.push(previewDocumentCommand);
	context.subscriptions.push(previewFragmentCommand);

	logger.write("commands added");
	vscode.window.showInformationMessage("vscode-masa-blazor-preview actived");
}

// This method is called when your extension is deactivated
export function deactivate() { }
