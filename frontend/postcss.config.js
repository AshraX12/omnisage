/**
 * PostCSS Configuration File.
 * 
 * Configures the build pipeline to run Tailwind CSS and Autoprefixer on the stylesheet.
 * Uses ES module syntax since the project package.json sets "type": "module".
 */

export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
