/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tl: '#1A4731',
        'tl-2': '#2F7A5A',
        tlx: '#D6E8DE',
        gd: '#B8922E',
        gdl: '#E5CE82',
        gdd: '#7A5E16',
        ink: '#100E0B',
        sft: '#5A5149',
        mut: '#857870',
        crd: '#E5DDD5',
        bdr: '#D4C8B8',
        pbg: '#ECE5DD',
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      borderRadius: {
        phone: '44px',
      },
    },
  },
  plugins: [],
};
