export const getColorClass = (color: string | undefined, bg: boolean = false): string => {
    if (!color || color === 'default') return '';
    
    const colorMap: { [key: string]: string } = {
      red: 'kal-text-red-500',
      blue: 'kal-text-blue-500',
      green: 'kal-text-green-500',
      yellow: 'kal-text-yellow-500',
      orange: 'kal-text-orange-500',
      purple: 'kal-text-purple-500',
      pink: 'kal-text-pink-500',
      gray: 'kal-text-gray-500',
      black: 'kal-text-black-500',
      white: 'kal-text-white-500'
    };

    const bgColorMap: { [key: string]: string } = {
        red: 'kal-bg-red-500',
        blue: 'kal-bg-blue-500',
        green: 'kal-bg-green-500',
        yellow: 'kal-bg-yellow-500',
        orange: 'kal-bg-orange-500',
        purple: 'kal-bg-purple-500',
        pink: 'kal-bg-pink-500',
        gray: 'kal-bg-gray-500',
        black: 'kal-bg-black-500',
        white: 'kal-bg-white-500'
    };
  
    if (bg) {
        return bgColorMap[color.toLowerCase()] || color.toLowerCase();
    } else {
        return colorMap[color.toLowerCase()] || color.toLowerCase();
    }
};