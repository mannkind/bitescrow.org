$(function() {
	$('body').click(SecureRandom.seedTime).keypress(SecureRandom.seedTime);
  	$('form').submit(function(e) { e.preventDefault(); });

	var disableButtons = function(item) { item.parent().children('button').attr('disabled', 'disabled'); };
	var enableButtons = function(item) { item.parent().children('button').attr('disabled', null); };
	var enableSpinner = function(item) { item.button('loading'); };
	var disableSpinner = function(item) { item.button('reset'); };
	var startProcess = function($this, $target) { disableButtons($this); enableSpinner($target); };
	var endProcess = function($this, $target) { enableButtons($this); disableSpinner($target); };
	
	$('#generate-codepair').click(function(e) {
		e.preventDefault();

		$this = $(this);
		$target = $(e.target);
		startProcess($this, $target);

		var escrow = Bitcoin.Escrow.CreateEscrowPair();
		if (escrow != null) {
			$('#gen-einva').val(escrow.invitationA);
			$('#gen-einvb').val(escrow.invitationB);
		}
		
		endProcess($this, $target);
	});

	$('#generate-payment').click(function(e) {
		e.preventDefault();

		$this = $(this);
		$target = $(e.target);
		startProcess($this, $target);

		var code1 = $('#payment-code1');
		if (code1.val().length != 106 || (code1.val().substr(0, 5) != 'einva' && code1.val().substr(0, 5) != 'einvb')) {
			code1.popover({ content: 'The escrow invitation code is invalid' }).popover('show');
			endProcess($this, $target);
			return;
		}

		var payment = Bitcoin.Escrow.CreatePaymentCode(code1.val());
		if (payment != null) {
			$('#payment-address').val(payment.address);
			$('#payment-einvp').val(payment.invitationP);
			$('#payment-cfrmp').val(payment.confirmationP);
		}
		
		endProcess($this, $target);
	});

	$('#verify').click(function(e) {
		e.preventDefault();

		$this = $(this);
		$target = $(e.target);
		startProcess($this, $target);

		var modal = $('#verify-modal');
		var verification = $('#verify-verification');

		var code1 = $('#verify-code1');
		if (code1.val().length != 106 || (code1.val().substr(0, 5) != 'einva' && code1.val().substr(0, 5) != 'einvb')) {
			code1.popover({ content: 'The escrow invitation code is invalid' }).popover('show');
			endProcess($this, $target);
			return;
		}

		var code2 = $('#verify-code2');
		if (code2.val().length != 106 || code2.val().substr(0, 5) != 'einvp') {
			code2.popover({ content: 'The payment invitation code is invalid' }).popover('show');
			endProcess($this, $target);
			return;
		}

		var verify = Bitcoin.Escrow.VerifyPaymentCode(code1.val(), code2.val());		
		if (verify.result) {
			verification.text('The bitcoin address ' + verify.address + ' is associated with your escrow');
		} else {
			verification.text(verify.message);
		}

       	modal.modal('show');
		endProcess($this, $target);
	});

	$('#verifyc').click(function(e) {
		e.preventDefault();

		$this = $(this);
		$target = $(e.target);
		startProcess($this, $target);

		var modal = $('#verifyc-modal');
		var verification = $('#verifyc-verification');

		var code1 = $('#verify-ccode1');
		if (code1.val().length != 106 || (code1.val().substr(0, 5) != 'einva' && code1.val().substr(0, 5) != 'einvb')) {
			code1.popover({ content: 'The escrow invitation code is invalid' }).popover('show');
			endProcess($this, $target);
			return;
		}

		var code2 = $('#verify-ccode2');
		if (code2.val().length != 106 || (code2.val().substr(0, 5) != 'einva' && code2.val().substr(0, 5) != 'einvb')) {
			code2.popover({ content: 'The escrow invitation code is invalid' }).popover('show');
			endProcess($this, $target);
			return;
		}

		var code3 = $('#verify-ccode3');
		if (code3.val().length != 106 || code3.val().substr(0, 5) != 'cfrmp') {
			code3.popover({ content: 'The payment confirmation code is invalid' }).popover('show');
			endProcess($this, $target);
			return;
		}

		var verify = Bitcoin.Escrow.VerifyConfirmationCode(code1.val(), code2.val(), code3.val());		
		if (verify.result) {
			verification.text('The bitcoin address ' + verify.address + ' is associated with the transaction');
		} else {
			verification.text(verify.message);
		}

       	modal.modal('show');
		endProcess($this, $target);
	});


	$('#redeem').click(function(e) {
		e.preventDefault();

		$this = $(this);
		$target = $(e.target);
		startProcess($this, $target);

		var code1 = $('#redeem-code1');
		if (code1.val().length != 106 || (code1.val().substr(0, 5) != 'einva' && code1.val().substr(0, 5) != 'einvb')) {
			code1.popover({ content: 'The escrow invitation code is invalid' }).popover('show');
			endProcess($this, $target);
			return;
		}

		var code2 = $('#redeem-code2');
		if (code2.val().length != 106 || (code2.val().substr(0, 5) != 'einva' && code2.val().substr(0, 5) != 'einvb')) {
			code2.popover({ content: 'The escrow invitation code is invalid' }).popover('show');
			endProcess($this, $target);
			return;
		}

		var code3 = $('#redeem-code3');
		if (code3.val().length != 106 || code3.val().substr(0, 5) != 'einvp') {
			code3.popover({ content: 'The payment invitation code is invalid' }).popover('show');
			endProcess($this, $target);
			return;
		}

		var redeem = Bitcoin.Escrow.Redeem(code1.val(), code2.val(), code3.val());		
		if (redeem != null) {
			$('#redeem-address').val(redeem.address);
			$('#redeem-wif').val(redeem.wif);
		}
		endProcess($this, $target);
	});

	/**
	 * Testing Code
	 */
	var hash;hash={};window.location.hash.replace(/[#&]+([^=&]+)=([^&]*)/g,function(g,h,i){return hash[h]=i});
	if (hash['runtests'] == 'true') {
		console.log('Running tests...');

		var tests = 
		[
			// einvp generated via einva
			[
			 'einvaKtrjaMk5AXxMYkpffnQihDxctvQrUE1jjdjpq3gUd6VULHKDHMRGa4Eh9uBT8fULac3tvg9GEti1TKRwjFJaViFu6i9Xxg2599CQu',
			 'einvbKtrjaKZe6VbRqUAA1vAcqavXvP2VaQmmwyMpA2swzhC6YLGhCNNHoHe2dogr1oCUcM8V92qxRoHeqD9uTCmUgqEHb7BhRsD6wmshZ',
			 'einvpKtrjaR33QFyM9R7DG3DtwgUqyQTrQuo3b5r1E19BjGdsuMNGppaznDRoe47MYxLmAoPFwRkmL1XwZT8gQJZ1buUZYwVsABJo6Tuy1',
			 '1C2DjDKvVLGmrPbdd7y328CKfhjc8YMdF4',
			 '5HtPQvgEQZpeJZ4nudJypx7mxRz8vVwoeW6N37f7Z2xAzifp6pg'
			],

			// einvp generated via einvb
			[
			 'einvaDpwkF4DqrhQD51t5jJig5fxTN1x1VgDA6gFp7HLzrmRPCVdPiQ41h8Dt44oc4eWNssJZpWmynUpwkzVLGHc4aZHXY9XxVRHqprAy3',
			 'einvbDpwkF2521asdUaYTGLfv2fEFEtr7ajU2ZgCjX5GNcYdoRrTBsoWGHoygi2Tj3xMCGsrwp2ktcr4rjbxXXhTwHTW5pdPfa1KkgJypy',
			 'einvpDpwkF7XD37DNNYrhkJob5UXCJLLfjrtHNLpCHMCzQsb6tHuimecuWkN9UCrrzWbyaeWk7tXAbnwruDrmveR4BAZDjCjhnjDHmvdCf',
			 '1Gv6ztrzMXRFdzs8SMQVGVK5G6bmSnA35H',
			 '5JR7cDzbDrw1K91hKprDKwwDVKTH4Ts36t2QeNdmTvZ5DswYZcd'
			],
		];

		// Test known (Casascius Bitcoin Tool generated) invitations
		var test = tests[0];
		var verify = Bitcoin.Escrow.VerifyPaymentCode(test[1], test[2]);
		if (!verify) {
			console.log('Testing failed VerifyPaymentCode #1');
		} else {
			console.log('Testing passed VerifyPaymentCode #1');
		}
		
		test = tests[1];
		var verify = Bitcoin.Escrow.VerifyPaymentCode(test[0], test[2]);
		if (!verify) {
			console.log('Testing failed VerifyPaymentCode #2');
		} else {
			console.log('Testing passed VerifyPaymentCode #2');
		}

		for (var i = 0; i < tests.length; i++) {
			var test = tests[i];

			var bitcoin = Bitcoin.Escrow.Redeem(test[0], test[1], test[2]);
			if (bitcoin.address != test[3] || bitcoin.wif != test[4]) {
				console.log('Testing failed Redeem #' + i);	
			} else {
				console.log('Testing passed Redeem #' + i);	
			}
		}

		// Generate some escrow pairs 
		for (var i = 0; i < 5; i++) {

			// Create new escrow invitations
			var escrow = Bitcoin.Escrow.CreateEscrowPair();
			if (escrow.invitationA.substr(0, 5) != 'einva' || escrow.invitationB.substr(0, 5) != 'einvb') {
				console.log('Testing failed GeneratedCreateEscrowPair #' + i);		
			} else {
				console.log('Testing passed GeneratedCreateEscrowPair #' + i);		
			}

			// Create a new payment invitiation
			var payment = Bitcoin.Escrow.CreatePaymentCode(escrow.invitationA);
			if (payment.invitationP.substr(0, 5) != 'einvp') {
				console.log('Testing failed GeneratedCreatePaymentCode #' + i);		
			} else {
				console.log('Testing passed GeneratedCreatePaymentCode #' + i);		
			}

			// Verify the payment invitiation
			var verify = Bitcoin.Escrow.VerifyPaymentCode(escrow.invitationB, payment.invitationP);
			if (!verify.result) {
				console.log('Testing failed GeneratedVerifyPaymentCode #' + i);
			} else {
				console.log('Testing passed GeneratedVerifyPaymentCode #' + i);
			}
      
			// Verify the payment confirmation code
			var verify = Bitcoin.Escrow.VerifyConfirmationCode(escrow.invitationA, escrow.invitationB, payment.confirmationP);
			if (!verify.result) {
				console.log('Testing failed GeneratedVerifyConfirmationCode #' + i);
			} else {
				console.log('Testing passed GeneratedVerifyConfirmationCode #' + i);
			}


			// Redeem the bitcoins
			var bitcoin = Bitcoin.Escrow.Redeem(escrow.invitationA, escrow.invitationB, payment.invitationP);
			if (bitcoin.address != payment.address || bitcoin.wif == '' || bitcoin.wif == null) {
				console.log('Testing failed GeneratedRedeem #' + i);	
			} else {
				console.log('Testing passed GeneratedRedeem #' + i);	
			}
		}

		console.log('... done');
	}
});
