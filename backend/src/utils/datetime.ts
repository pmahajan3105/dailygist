export const getSlashDateString = (dateValue: number): string => {
    const date = new Date(dateValue);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

export const getCurrentDate = () => {
    return new Date().getDate();
}

export const addNDaysToDate = (n: number, date = new Date()) => {
    return date.setDate(date.getDate() + n)
}

export const getCurrentTimestamp = () => {
    return new Date();
}