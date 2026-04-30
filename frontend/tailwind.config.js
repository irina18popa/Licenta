/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily:{
        "rubik": ['Rubik-Regular', 'sans-serif'],
        "rubik-bold": ['Rubik-Bold', 'sans-serif'],
        "rubik-extrabold": ['Rubik-ExtraBold', 'sans-serif'],
        "rubik-medium": ['Rubik-Medium', 'sans-serif'],
        "rubik-semibold": ['Rubik-SemiBold', 'sans-serif'],
        "rubik-light": ['Rubik-Light', 'sans-serif'],
      },
      
      boxShadow: {
        innerNeu: 'inset 5px 5px 10px #0b0b0b, inset -5px -5px 10px #202020',
        outerNeu: '9px 9px 16px #0b0b0b, -9px -9px 16px #202020',
      },
      // colors:{
      //   "primary":
      //   {
      //     100: '#0061FF0A',
      //     200: '#0061FF1A',
      //     300: '#0061FF'
      //   },
      //   "accent": 
      //   {
      //     100: '#FBFBFD'
      //   },
      //   "black": 
      //   {
      //     DEFAULT: '#000000',
      //     100: '#8C8E98',
      //     200: '#666876',
      //     300: '#191D31'
      //   },
      //   "danger":'#F75555'
      // }
    },
  },
  plugins: [],
}