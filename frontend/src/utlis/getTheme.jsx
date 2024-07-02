export const getTheme = () => {
    const value = localStorage.getItem("theme");
    return value;
};
