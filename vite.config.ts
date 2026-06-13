import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { resolve } from 'path'
import fs from 'fs'

const certPath = resolve(__dirname, '.certs/cert.pem')
const keyPath = resolve(__dirname, '.certs/key.pem')
const httpsConfig =
  fs.existsSync(certPath) && fs.existsSync(keyPath)
    ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
    : undefined

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: httpsConfig ? 'beer.local' : 'localhost',
    port: httpsConfig ? 443 : 5173,
    https: httpsConfig,
  },
})
