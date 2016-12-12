var solitaire = (function() {

	var deck = Array(52);

	var stock, waste = null;
	var foundation = Array(4);
	var tableau = Array(7);
	var hidden_tableau = Array(7);

	// Cache DOM
	var $sol = $("#solitaire");
	var $stock = $sol.find("#stock");
	var $waste = $sol.find("#waste");
	var $foundation = $sol.find("#foundation");
	var $tableau = $sol.find("#tableau");

	var stock_tmp = $stock.find('#stock-template').html();
	var waste_tmp = $waste.find('#waste-template').html();
	var foundation_tmp = $foundation.find('#foundation-template').html();
	var tableau_tmp = $tableau.find('#tableau-template').html();

	var selection = null;

	// Bind Events
	$stock.click(draw);
	$sol.delegate('.card-movable', 'click', selectCard);

	function render() {
		$stock.html( Mustache.render(stock_tmp, {stock_amount: stock.length}) );

		console.log(waste[waste.length-1]);
		$waste.html( Mustache.render(waste_tmp, {top_card: toCard(waste[waste.length-1])}) );

		// TODO
		$foundation.html( Mustache.render(foundation_tmp, {}) );

		//tableau_torender = {piles: cards: card}
		var tableau_torender = Array();
		for (var i=0; i<tableau.length; i++) {
			tableau_torender.push( {cards: Array()} );

			if (hidden_tableau[i] >= tableau[i].length) {
				hidden_tableau[i] = tableau[i].length - 1;
			}

			for (var j=0; j<tableau[i].length; j++) {
				if (hidden_tableau[i] > j) {
					tableau_torender[i].cards.push( {card: '--'} );
				}
				else {
					tableau_torender[i].cards.push( {card: toCard(tableau[i][j])} );
				}
			}
		}

		$tableau.html( Mustache.render(tableau_tmp, {piles: tableau_torender}) );

		$tableau = $sol.find("#tableau");
	}

	// converts an integer to a card string
	function toCard(val) {
		if ( val == undefined ) {
			return '';
		}
		var suits = ['&spades;', '&clubs;', '&diams;', '&hearts;'];

		var suit = suits[ Math.floor(val / 13) ];
		var value = val % 13;
		if (value == 0) {
			value = 'A';
		} else if (value == 10) {
			value = 'J';
		} else if (value == 11) {
			value = 'Q';
		} else if (value == 12) {
			value = 'K';
		} else {
			value += 1;
		}

		return value + ' ' + suit;
	}

	function deal() {
		
		// fill deck
		for (i=0; i<deck.length; i++) {
			deck[i] = i;
		}
		
		// shuffle
		var counter = deck.length;
		while (counter > 0) {
			var i = Math.floor(Math.random() * counter);

			counter--;

			var temp = deck[counter];
			deck[counter] = deck[i];
			deck[i] = temp;
		}
	
		// deal to tableau
		for (var i=0; i<tableau.length; i++) {
			tableau[i] = Array();
			hidden_tableau[i] = i;

			for (var j=0; j < i+1; j++) {
				tableau[i].push(deck.pop());
			}
		}

		// place remaining cards in stock
		stock = deck;

		// initialize waste to empty array
		waste = Array();

		render();

	}

	// Draw from stock to waste
	function draw() {
		if (stock.length > 0) {
			waste.push( stock.pop() );
		}
		else {
			stock = waste.reverse();
			waste = Array();
		}

		render();
	}

	function selectCard(evt) {
		var $target = $(evt.target);

		if ( $target.hasClass('card-tableau') ) {
			var $tableaus_list = $tableau.find('#tableau-piles');
			var $pile = $target.closest('ul');

			var pile = $tableaus_list.children('li').index( $pile.closest('li') );
			var card = $pile.find('li').index( $target );

			var new_selection = {location: 'tableau', pile: pile, card: card};
		}

		// If another card was previous selected, try to move it
		if (selection) {
			var movee = getCardValFromSelection(selection);
			var target = getCardValFromSelection(new_selection);

			if (isValidMove(movee, target)) {
				moveCard(selection, new_selection);
			}
			else {
				console.log('Invalid Move');
			}

			selection = null;
		}
		else {
			selection = new_selection;
		}
	}

	function getCardValFromSelection(sel) {
		if (sel.location == 'tableau') {
			return tableau[sel.pile][sel.card];
		}
	}

	function isValidMove(movee, target) {
		var movee = { black: Math.floor(movee / 13) < 2,
					  value: movee % 13 }
		var target = { black: Math.floor(target / 13) < 2,
					   value: target % 13 }

		console.log(movee);
		console.log(target);

		if (target.value - movee.value == 1 && movee.black != target.black) {
			return true;
		}
		else {
			return false;
		}
	}

	function moveCard(movee, target) {
		var source_array = null;
		if (movee.location == 'tableau') {
			source_array = tableau[movee.pile];
		}

		var dest_array = null;
		if (target.location == 'tableau') {
			dest_array = tableau[target.pile];
		}

		dest_array.push( source_array.pop() )

		render();
	}

	deal();

})();
