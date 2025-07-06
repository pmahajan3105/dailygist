export const groupListOfObjectByKey = (list: any[], key: string) => {
    if (list.length) {
        return list.reduce(function (r, a) {
            r[a[`${key}`]] = r[a[`${key}`]] || [];
            r[a[`${key}`]].push(a);
            return r;
        }, Object.create(null));
    }
    return null;
};