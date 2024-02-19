function transformAndFormatArray(inputArray) {
    // Transform the array into a string and remove the first and last characters (which are [ and ])
    let result = JSON.stringify(inputArray).slice(1, -1);

    // Replace all instances of '],' with '],\n  ' for formatting (to add a new line and indentation after each array closing)
    result = result.replace(/\],/g, '],\n  ');

    return result;
}

// Example array input
const inputArray = [
  [
    '0x098135215ef533a1b9e6606e38e5cc667afbd3a2060cb93af42af1beb85c1940',
    '0x1372ecfe72c3f823a195e9e80d748769d8418833146759a1f621a22ffbdd7466'
  ],
  [
    [
      '0x051e411af51c89c5a05084261441bdd24dfabeec59271945575937dd3eeba16c',
      '0x224b1299d2ab2875a4ebbe701301abefe2baf4bce16972666aacbde7a4786a72'
    ],
    [
      '0x179d294f93c271e17359466edcb3ba3e617decd23da0408c08de5cbff73ecde4',
      '0x0305558702afe27c6c0d84642f6f3d04c8c78a1c90166e011b7f1931f9d78db3'
    ]
  ],
  [
    '0x269a741c4ca1f08bd2d7adbc872231d75211928a0f50cca8ef1cfb92607f6fb2',
    '0x24f4135df543e8d880c4cd9033b4e54f935fa9c1f4692f3787f809731c89848e'
  ],
  [
    '0x2deb23692cef11ff526297eebd6889c96ff0bfee6125ead2b269c8a41dd47592',
    '0x241e9c2dd1d70197be0ee9e4844724af5bead0c7b3ceb6beb7397a099d146adc'
  ]
];

const formattedOutput = transformAndFormatArray(inputArray);
console.log(formattedOutput);
