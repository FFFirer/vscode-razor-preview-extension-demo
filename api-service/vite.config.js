export default {
    server: {
        port: '3000',
        proxy: {
            '^/proxy': {
                target: "http://localhost:5000",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/proxy/, '')
            }
        }
    }
}