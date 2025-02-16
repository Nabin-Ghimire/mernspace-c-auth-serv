function welcome(name: string) {
    console.log(`Welcome ${name}`);
    const user = {
        name: 'Nabin',
    };
    const fname = user.name;
    return name + fname;
}
welcome('Nabin');
