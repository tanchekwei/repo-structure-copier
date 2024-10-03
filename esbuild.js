const esbuild = require("esbuild");
const fs = require('fs');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

/**
 * @type {import('esbuild').Plugin}
 */
const wasmPlugin = {
	name: 'wasm',
	setup(build) {
		build.onResolve({ filter: /\.wasm$/ }, args => ({
			path: args.path,
			namespace: 'wasm-binary',
		}));
		build.onLoad({ filter: /\.wasm$/, namespace: 'wasm-binary' }, async (args) => {
			const contents = await fs.promises.readFile(args.path);
			return {
				contents,
				loader: 'binary',
			};
		});
	},
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: [
			{ in: 'src/extension.ts', out: 'extension' },
			{ in: 'src/webview/index.tsx', out: 'webview' }
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		outdir: 'dist',
		external: ['vscode', 'fs', 'fs/promises', 'path'],
		logLevel: 'silent',
		plugins: [
			esbuildProblemMatcherPlugin,
			wasmPlugin,
		],
		loader: {
			'.tsx': 'tsx',
			'.wasm': 'binary'
		},
		define: {
			'process.env.NODE_ENV': production ? '"production"' : '"development"'
		},
		platform: 'node',
	});
	if (watch) {
		await ctx.watch();
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
