Bitcoin.Escrow = {
	einva: new BigInteger('140bebc0a12ca9c6', 16),
	einvb: new BigInteger('140bebc16ae0563b', 16),
	einvp: new BigInteger('140bebcba900182f', 16),
	cfrmp: new BigInteger('12f4eff38f7d74f9', 16),

	CreateEscrowPair: function() {
		var x = Array(32);
		var y = Array(32);

		var rng = new SecureRandom();
		rng.nextBytes(x);
		rng.nextBytes(y);

	    x[31] &= 0xFE;
        y[31] |= 0x01;

        var xi = BigInteger.fromByteArrayUnsigned(x);
        var yi = BigInteger.fromByteArrayUnsigned(y);

		var Kx = new Bitcoin.ECKey(x);
		var Ky = new Bitcoin.ECKey(y);

		var curve = EllipticCurve.getSECCurveByName("secp256k1");
		var ec = curve.getCurve();

		var Gx = curve.getCurve().decodePointHex(Kx.getPubKeyHex())
		var Gy = curve.getCurve().decodePointHex(Ky.getPubKeyHex())
		var Gxy = Gx.multiply(yi);
		var hashGxy = Bitcoin.Util.dsha256(Gxy.getEncoded());
	
		var identifier30 = ((hashGxy[0] & 0x3f) << 24) + (hashGxy[1] << 16) + (hashGxy[2] << 8) + hashGxy[3];
		var identifier30i = new BigInteger(identifier30.toString());

		var invitationA = this.einva.add(identifier30i).toByteArrayUnsigned().concat([0]).concat(x).concat(Gy.getEncoded(1).slice(0, 34));
		var invitationB = this.einvb.add(identifier30i).toByteArrayUnsigned().concat([0]).concat(y).concat(Gx.getEncoded(1).slice(0, 34));

		invitationA = invitationA.concat(Bitcoin.Util.dsha256(invitationA).slice(0,4));
		invitationB = invitationB.concat(Bitcoin.Util.dsha256(invitationB).slice(0,4));

		return {
			invitationA: Bitcoin.Base58.encode(invitationA),
			invitationB: Bitcoin.Base58.encode(invitationB)
		}
	},

	CreatePaymentCode: function(thecode) {
		if (thecode == null || (thecode.substr(0, 5) != 'einva' && thecode.substr(0, 5) != 'einvb')) {
			return null;
		}

		var thecodeBytes = Bitcoin.Base58.decode(thecode);
		thecodeBytes = thecodeBytes.slice(0, thecodeBytes.length - 4);

		if (thecodeBytes.length != 74) { return null; }

		var priv = thecodeBytes.slice(9, 32+9);
		var pub = thecodeBytes.slice(41, 33+41);

		var head = BigInteger.fromByteArrayUnsigned(thecodeBytes.slice(0, 8));
		var identifier30i = new BigInteger('0');

		if (head.compareTo(this.einva) < 0) { return null; } 

		if (head.compareTo(this.einvb) < 0) { 
			identifier30i = head.subtract(this.einva); 
		} else { 
			identifier30i = head.subtract(this.einvb); 
		}

        // produce a new factor
        var z = new Array(32);
        var rng = new SecureRandom();
        rng.nextBytes(z);
        
        var zi = BigInteger.fromByteArrayUnsigned(z);
        var privi = BigInteger.fromByteArrayUnsigned(priv);

        var Kz = new Bitcoin.ECKey(z);

		var curve = EllipticCurve.getSECCurveByName("secp256k1");
		var Gz = curve.getCurve().decodePointHex(Kz.getPubKeyHex())
		var Gxyz = curve.getCurve().decodePointHex(Crypto.util.bytesToHex(pub).toString().toUpperCase()).multiply(privi).multiply(zi)
		var hash160 = Bitcoin.Util.sha256ripe160(Gxyz.getEncoded());
		var address = new Bitcoin.Address(hash160).toString();

		var invitationP = this.einvp.add(identifier30i).toByteArrayUnsigned().concat([0, 0]).concat(z).concat(hash160);
	    for (var i = invitationP.length; i < 74; i++) {
	    	invitationP.push(0);
	    }

		if (thecode.substr(0, 5) == 'einvb') { 
			invitationP[62] = 0x2;
		}

		invitationP = invitationP.concat(Bitcoin.Util.dsha256(invitationP).slice(0,4));

		var confirmationP = this.cfrmp.add(identifier30i).toByteArrayUnsigned().concat([0]).concat(Gz.getEncoded(1)).concat(hash160);
	    for (var i = confirmationP.length; i < 74; i++) {
	    	confirmationP.push(0);
	    }

		if (thecode.substr(0, 5) == 'einvb') { 
			confirmationP[62] = 0x2;
		}

		confirmationP = confirmationP.concat(Bitcoin.Util.dsha256(confirmationP).slice(0,4));



		return {
			address: address,
			invitationP: Bitcoin.Base58.encode(invitationP),
			confirmationP: Bitcoin.Base58.encode(confirmationP)
		}

	},

	VerifyPaymentCode: function(code1, code2) {
        var escrowInvitationCode = null, paymentInvitationCode = null;

        if (code1.substr(0, 5) == "einva" || code1.substr(0, 5) == "einvb") escrowInvitationCode = code1;
        if (code2.substr(0, 5) == "einva" || code2.substr(0, 5) == "einvb") escrowInvitationCode = code2;
        if (code1.substr(0, 5) == "einvp") paymentInvitationCode = code1;
        if (code2.substr(0, 5) == "einvp") paymentInvitationCode = code2;

		var thecodeBytes = Bitcoin.Base58.decode(escrowInvitationCode);
		thecodeBytes = thecodeBytes.slice(0, thecodeBytes.length - 4);

		if (thecodeBytes.length != 74) { 
			return { result: false, address: '', message: 'Invalid Escrow Invitation' };
		}

		var priv = thecodeBytes.slice(9, 32+9);
		var pub = thecodeBytes.slice(41, 33+41);

		thecodeBytes = Bitcoin.Base58.decode(paymentInvitationCode);
		thecodeBytes = thecodeBytes.slice(0, thecodeBytes.length - 4);

		if (thecodeBytes.length != 74) { 
			return { result: false, address: '', message: 'Invalid Escrow Invitiation' };
		}

		var head = BigInteger.fromByteArrayUnsigned(thecodeBytes.slice(0, 8));

		var identifier30i = new BigInteger('0');

		if (head.compareTo(this.einvp) < 0) { 
			return { result: false, address: '', message: 'Invalid Payment Invitation' };
		} 
		
		identifier30i = head.subtract(this.einvp); 

		var privi = BigInteger.fromByteArrayUnsigned(priv);
		var privpartz = thecodeBytes.slice(10, 10+32);
		var privpartzi = BigInteger.fromByteArrayUnsigned(privpartz);
		var networkByte = thecodeBytes[8];
		var compressedFlag = (thecodeBytes[8+1+1+32+20] & 0x1) == 1;

		var curve = EllipticCurve.getSECCurveByName("secp256k1");
		var Gxyz = curve.getCurve().decodePointHex(Crypto.util.bytesToHex(pub).toString().toUpperCase()).multiply(privi).multiply(privpartzi)

		var hash160 = Bitcoin.Util.sha256ripe160(Gxyz.getEncoded());
		var address = new Bitcoin.Address(hash160).toString();

		// Does the hash160 match?!
		for (var i = 0; i < 20; i++) {
			if (hash160[i] != thecodeBytes[8+1+1+32+i]) { 
				return { result: false, address: '', message: 'Warning: The Hash160 of the Bitcoin Address does not match!' };
			}
		}

		var expectedabflag = escrowInvitationCode.substr(0, 5) == 'einva' ? 2 : 0;
		if ((thecodeBytes[8+1+1+32+20] & 0x2) != expectedabflag) {
			return { result: false, address: '', message: 'Warning: Same Party Generated the Payment Invitation.' };
		}

		return { result: true, address: address };
	},

	VerifyConfirmationCode: function(code1, code2, code3) {
        var escrowInvitationCodeA = null, escrowInvitationCodeB = null, paymentConfirmationCode = null;

        if (code1.substr(0, 5) == "einva") escrowInvitationCodeA = code1;
        if (code2.substr(0, 5) == "einva") escrowInvitationCodeA = code2;
        if (code3.substr(0, 5) == "einva") escrowInvitationCodeA = code3;
        if (code1.substr(0, 5) == "einvb") escrowInvitationCodeB = code1;
        if (code2.substr(0, 5) == "einvb") escrowInvitationCodeB = code2;
        if (code3.substr(0, 5) == "einvb") escrowInvitationCodeB = code3;
        if (code1.substr(0, 5) == "cfrmp") paymentConfirmationCode = code1;
        if (code2.substr(0, 5) == "cfrmp") paymentConfirmationCode = code2;
        if (code3.substr(0, 5) == "cfrmp") paymentConfirmationCode = code3;

		var thecodeBytes = Bitcoin.Base58.decode(escrowInvitationCodeA);
		thecodeBytes = thecodeBytes.slice(0, thecodeBytes.length - 4);

		if (thecodeBytes.length != 74) { 
			return { result: false, address: '', message: 'Invalid Escrow Invitation' };
		}

		var privA = thecodeBytes.slice(9, 32+9);
    var privAi = BigInteger.fromByteArrayUnsigned(privA);

		thecodeBytes = Bitcoin.Base58.decode(escrowInvitationCodeB);
		thecodeBytes = thecodeBytes.slice(0, thecodeBytes.length - 4);

		if (thecodeBytes.length != 74) { 
			return { result: false, address: '', message: 'Invalid Escrow Invitation' };
		}

		var privB = thecodeBytes.slice(9, 32+9);
    var privBi = BigInteger.fromByteArrayUnsigned(privB);

		thecodeBytes = Bitcoin.Base58.decode(paymentConfirmationCode);
		thecodeBytes = thecodeBytes.slice(0, thecodeBytes.length - 4);

		if (thecodeBytes.length != 74) { 
			return { result: false, address: '', message: 'Invalid Escrow Invitiation' };
		}

		var Gz = thecodeBytes.slice(9, 33+9)
		var head = BigInteger.fromByteArrayUnsigned(thecodeBytes.slice(0, 8));

		var identifier30i = new BigInteger('0');

		if (head.compareTo(this.cfrmp) < 0) { 
			return { result: false, address: '', message: 'Invalid Payment Confirmation' };
		} 
		
		identifier30i = head.subtract(this.cfrmp); 

		var networkByte = thecodeBytes[8];
		var compressedFlag = (thecodeBytes[8+1+1+32+20] & 0x1) == 1;

		var curve = EllipticCurve.getSECCurveByName("secp256k1");
		var Gxyz = curve.getCurve().decodePointHex(Crypto.util.bytesToHex(Gz).toString().toUpperCase()).multiply(privAi).multiply(privBi)

		var hash160 = Bitcoin.Util.sha256ripe160(Gxyz.getEncoded());
		var address = new Bitcoin.Address(hash160).toString();

		// Does the hash160 match?!
		for (var i = 0; i < 20; i++) {
			if (hash160[i] != thecodeBytes[8+1+1+32+i]) { 
				return { result: false, address: '', message: 'Warning: The Hash160 of the Bitcoin Address does not match!' };
			}
		}

		return { result: true, address: address };
	},


	Redeem: function(code1, code2, code3) {
	    var codea = null, codeb = null, codep = null;

	    if (code1.substr(0, 5) == "einva") codea = code1;
	    if (code2.substr(0, 5) == "einva") codea = code2;
	    if (code3.substr(0, 5) == "einva") codea = code3;
	    if (code1.substr(0, 5) == "einvb") codeb = code1;
	    if (code2.substr(0, 5) == "einvb") codeb = code2;
	    if (code3.substr(0, 5) == "einvb") codeb = code3;
	    if (code1.substr(0, 5) == "einvp") codep = code1;
	    if (code2.substr(0, 5) == "einvp") codep = code2;
	    if (code3.substr(0, 5) == "einvp") codep = code3;

	    /* Code A */
		thecodeBytes = Bitcoin.Base58.decode(codea);
		thecodeBytes = thecodeBytes.slice(0, thecodeBytes.length - 4);
		if (thecodeBytes.length != 74) { return null; }

		var priva = thecodeBytes.slice(9, 32+9);
		var privai = BigInteger.fromByteArrayUnsigned(priva);
		
		/* Code B */
		thecodeBytes = Bitcoin.Base58.decode(codeb);
		thecodeBytes = thecodeBytes.slice(0, thecodeBytes.length - 4);
		if (thecodeBytes.length != 74) { return null; }

		var privb = thecodeBytes.slice(9, 32+9);
		var privbi = BigInteger.fromByteArrayUnsigned(privb);

		/* Code P */
		thecodeBytes = Bitcoin.Base58.decode(codep);
		thecodeBytes = thecodeBytes.slice(0, thecodeBytes.length - 4);
		if (thecodeBytes.length != 74) { return null; }

		var head = BigInteger.fromByteArrayUnsigned(thecodeBytes.slice(0, 8));
		var identifier30i = new BigInteger('0');
		if (head.compareTo(this.einvp) < 0) { 
			return null; 
		} 
		
		identifier30i = head.subtract(this.einvp); 

		var privz = thecodeBytes.slice(10, 10+32);
		var privzi = BigInteger.fromByteArrayUnsigned(privz);
		var networkByte = thecodeBytes[8];
		var compressedFlag = (thecodeBytes[8+1+1+32+20] & 0x1) == 1;

		var xyz = privai.multiply(privbi).multiply(privzi);
		var curve = EllipticCurve.getSECCurveByName("secp256k1");
		xyz = xyz.mod(curve.getN());

		var bitcoin = new Bitcoin.ECKey(xyz.toByteArrayUnsigned());

		return {
			address: bitcoin.getBitcoinAddress(),
			wif: bitcoin.getBitcoinWalletImportFormat()
		}
	}
}
