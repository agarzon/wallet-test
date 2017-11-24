/*jshint esversion: 6 */
var Wallet = (function() {
    'use strict';

    var bitcore = require('bitcore-lib');
    var explorers = require('bitcore-explorers');
    var mnemonic = require('bitcore-mnemonic');

    var maxAddresses = 10;
    var addresses = [];

    /**
     * Here lies all the secret... change this lines to make it work with any other altcoin.
     */
    var derivationPath = "m/44'/81'/0'/0";
    var blockchainUrl = 'https://chain.potcoin.com';
    var PotNet = {
        name: 'potcoin',
        alias: 'potcoin',
        pubkeyhash: 0x37, // 55
        privatekey: 0xB7, // 183 (wif)
        scripthash: 0x05, // 5
        xpubkey: 0x0488b21e,
        xprivkey: 0x0488ade4,
        port: 4200
    };

    var insight = new explorers.Insight(blockchainUrl);

    function generateNemo() {
        var code = new mnemonic(); // English words
        var mnemo = code.toString();
        console.log(mnemo);
        return mnemo;
    }

    function getMasterKey(mnemo, pass) {
        if (validatesNemo(mnemo) === false) {
            throw new Error("Seed code is not valid.");
        }
        var code = new mnemonic(mnemo);
        var xpriv = code.toHDPrivateKey(pass);
        return xpriv;
    }

    function generateHD(xpriv) {
        // Validate xpriv?
        setNetwork(); // Use the network
        var hdPrivateKey = bitcore.HDPrivateKey(xpriv);
        //console.log(hdPrivateKey);
        //var hdPublicKey = hdPrivateKey.hdPublicKey;
        //console.log(hdPublicKey); // kind of useless, since won't be used for derivation

        for (var i = 0; i < maxAddresses; i++) {
            var derived = hdPrivateKey.derive(derivationPath).derive(i);
            var address = new bitcore.Address(derived.publicKey).toString();
            var privatekey = derived.privateKey.toWIF();
            addresses.push({ id: i, address: address, privatekey: privatekey });
        }

        return addresses;
    }

    function prepareTX(address, desination, amount, privatekey) {
        if (validatesAddress(address) === false) {
            throw new Error("Source address is not valid.");
        }
        if (validatesAddress(desination) === false) {
            throw new Error("Destination address is not valid.");
        }
        // validate amount as bigint and set

        if (validatesPriv(privatekey) === false) {
            throw new Error("PrivateKey is not valid.");
        }

        insight.getUnspentUtxos(address, function(err, utxos) {
            if (err) {
                throw new Error(err);
            }

            // validate amount is available in balance
            // validate fee is acceptable.
            console.log(utxos);
            setNetwork(); // Use the network
            var transaction = new bitcore.Transaction()
                .from(utxos)
                .to(desination, amount)
                //.fee(300000)
                //.lockUntilDate(new Date()) // Set timestamp into tx
                .change(address)
                .sign(privatekey);

            console.log(transaction);
            console.log("Verify = " + transaction.verify());
            console.log("Signature = " + transaction.isFullySigned());

            var txSerialized = transaction.serialize();
            console.log(txSerialized);

            //throw new Error("STOP");
            insight.broadcast(txSerialized, function(err, txId) {
                if (err) {
                    console.error(err);
                    //console.log(JSON.stringify(err));
                } else {
                    console.log('Successfully sent: '+txId);
                }
            });
        });
    }

    /**
     * Validations
     */
    function validatesNemo(mnemo) {
        if (typeof mnemo !== 'undefined') {
            return mnemonic.isValid(mnemo);
        }

        throw new Error("Where is the seed?");
    }

    function validatesPriv(privKey) {
        if (typeof privKey !== 'undefined') {
            return bitcore.PrivateKey.isValid(privKey);
        }

        throw new Error("No private key provided.");
    }

    function validatesPub(pubKey) {
        if (typeof pubKey !== 'undefined') {
            return bitcore.PublicKey.isValid(pubKey);
        }

        throw new Error("No public key provided.");
    }

    function validatesAddress(address) {
        if (typeof address !== 'undefined') {
            return bitcore.Address.isValid(address);
        }

        throw new Error("No address provided.");
    }

    function setNetwork() {
        var AltNet = new bitcore.Networks.add(PotNet); // Set potcoin network as default
        bitcore.Networks.defaultNetwork = AltNet;
    }

    /* =============== export public methods =============== */
    return {
        //init: init, // no init for now
        generateNemo: generateNemo,
        validatesNemo: validatesNemo, // Useful only with generateHD
        validatesPriv: validatesPriv, // Useful only to import
        //validatesPub: validatesPub, // Kind of useless
        validatesAddress: validatesAddress,
        getMasterKey: getMasterKey,
        generateHD: generateHD,
        prepareTX: prepareTX,
        addresses: addresses,
    };
}());
