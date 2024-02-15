import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
	// コマンドパレットから実行するコマンドを登録
	context.subscriptions.push(vscode.commands.registerCommand('codetohtml.run', async () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return;
		}
		const highlightHtml = await getHTML(context);
		await createWebview(context, highlightHtml);
	}));
}

// 取得したハイライトされたHTML等、諸々のアセットを一つのHTMLにまとめる
async function createWebview(context: vscode.ExtensionContext, highlightHtml: string) {
	const indexUri = path.resolve(context.extensionPath, 'webview/html/index.html');
	const webview = vscode.window.createWebviewPanel('codetohtml', 'Code to HTML', vscode.ViewColumn.One, {
		enableScripts: true
	});
	let indexHtml = fs.readFileSync(indexUri, 'utf-8');
	indexHtml = htmlPathToUri(context, webview.webview, indexHtml);
	indexHtml = indexHtml.replace('<!-- [CodeToHTML] PLACEHOLDER DO NOT REMOVE -->', highlightHtml);
	webview.webview.html = indexHtml;
}


// htmlに記載されたパスをVSCodeのURIに変換
function htmlPathToUri(context: vscode.ExtensionContext, webview: vscode.Webview, html: string) {
	// srcかhrefに記載されたパスを取得
	const regex = /(?:src|href)="(.+?)"/g;
	// すべてのパスをVSCode Resource URIに変換
	const result = html.replace(regex, (match, p1) => {
		return match.replace(p1, webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'webview/', p1))).toString());
	});
	return result;
}


// Webviewを使ってハイライトされたHTMLを取得
async function getHTML(context: vscode.ExtensionContext) {
	// クリップボードのデータを変更するため、古いデータを一時的に保存
	const clipboardText = await vscode.env.clipboard.readText();
	vscode.commands.executeCommand('editor.action.selectAll');
	vscode.commands.executeCommand('editor.action.clipboardCopyWithSyntaxHighlightingAction');
	vscode.commands.executeCommand('cancelSelection');

const webview = vscode.window.createWebviewPanel('codetohtml', 'Code to HTML', vscode.ViewColumn.One, {
		enableScripts: true
	});

	// webviewにHTMLを読み込む
	const htmlUri = path.resolve(context.extensionPath, 'webview/html/get-html.html');
	const htmlContent = fs.readFileSync(htmlUri, 'utf-8');
	webview.webview.html = htmlContent;

	// webviewからハイライトされたHTMLを取得
	const highlightHTML = await new Promise<string>((resolve) => {
		webview.webview.onDidReceiveMessage((message) => {
			if (message.command === 'getHTML') {
				resolve(message.result);
			}
		});
		webview.webview.postMessage({ command: 'getHTML' });
	});
	webview.dispose();

	// 古いクリップボードのデータを復元
	vscode.env.clipboard.writeText(clipboardText);

	return highlightHTML;
}

// async function saveFile(uri: vscode.Uri, text: string) {
// 	// ファイル保存ダイアログを表示
// 	return new Promise<void>((resolve, reject) => {
// 		vscode.window.showSaveDialog({
// 			defaultUri: uri,
// 			filters: {
// 				HTML: ['html']
// 			}
// 		}).then((uri) => {
// 			if (uri) {
// 				vscode.workspace.fs.writeFile(uri, Buffer.from(text, 'utf-8'));
// 				resolve();
// 			} else {
// 				reject();
// 			}
// 		});
// 	});
// }

export function deactivate() {}
