Some personal notes, how I compile the JS files from https://github.com/potcoin/PotcoinJS
```
browserify potcoinjs-lib/src/index.js -s potcoin > new-potcoin.js
```

```
uglifyjs new-potcoin.js --compress  --mangle -o new-potcoin.min.js
```