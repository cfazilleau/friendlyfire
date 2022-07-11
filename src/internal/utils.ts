import * as color from '@heroku-cli/color';

type ColorDelegate = (input: string) => string;

function GetFileName(err : Error) : string
{
	// Split captured stack to cature correct line
	const stack = err.stack?.split('\n');
	if (stack == undefined || stack.length < 3)
	{
		throw undefined;
	}

	// Regex to extract relative path from the line
	const matches = stack[2].match(/(?:dist[\\/])(.+\.[jt]s)/s);
	if (matches == undefined || matches.length < 1)
	{
		throw undefined;
	}

	// Filename is the second match
	return matches[1];
}

function GetLabel(fileName: string) : string
{
	// Regex to get last part of path and trim file extension
	const matches : RegExpMatchArray = fileName.match(/(.+[\\/])*(.+).[jt]s/i) ?? [];
	const label : string = matches.at(-1) ?? 'global';
	const colorDelegate = GetColorDelegate(fileName);

	return colorDelegate(`[${label}]`);
}

function GetColorDelegate(fileName: string) : ColorDelegate
{
	// handle filename cases
	switch (fileName)
	{
	// special case for files under the 'plugins' folder
	case fileName.match(/^plugins[/\\]/)?.input:
		return color.color.cyan;

	case 'main.js':
		return color.color.green;

	case fileName.match(/^internal[/\\]config\.js/)?.input:
		return color.color.yellow;

	case 'plugin.js':
	case fileName.match(/^internal[/\\]pluginloader\.js/)?.input:
		return color.color.blue;

	case fileName.match(/^internal[/\\]mongodb\.js/)?.input:
		return color.color.greenBright;

	default:
		return (s) => s;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Log(text : any) : void
{
	const fileName = GetFileName(new Error());
	const label = GetLabel(fileName);

	console.log(`${label} ${text}`);
}