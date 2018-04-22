function doMath(n1, n2, op) {
    n1 = Number(n1);
    n2 = Number(n2);
    let opHandler = {
        '+': () => n1+n2,
        '-': () => n1-n2,
        '*': () => n1*n2,
        '/': () => n1/n2,
    };
    return opHandler[op](n1,n2);
}
// console.log(process)
console.log(doMath(process.argv[2], process.argv[4], process.argv[3]));

// console.log(doMath(1,8,'+'));