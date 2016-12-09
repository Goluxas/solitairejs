var solitaire = (function() {

	var deck = Array(52);

	var stock, waste = null;
	var foundation = Array(4);
	var tableau = Array(7);
	var hidden_tableau = Array(7);

	// Cache DOM
	$sol = $("#solitaire");
	$stock = $sol.find("#stock");
	$waste = $sol.find("#waste");
	$foundation = $sol.find("#foundation");
	$tableau = $sol.find("#tableau");

	stock_tmp = $stock.find('#stock-template').html();
	waste_tmp = $waste.find('#waste-template').html();
	foundation_tmp = $foundation.find('#foundation-template').html();
	tableau_tmp = $tableau.find('#tableau-template').html();

	function render() {
		$stock.html( Mustache.render(stock_tmp, {stock_amount: stock.length}) );

		$waste.html( Mustache.render(waste_tmp, {top_card: waste[waste.length-1]}) );

		// TODO
		$foundation.html( Mustache.render(foundation_tmp, {}) );

		//tableau_torender = {piles: cards: card}
		var tableau_torender = Array();
		for (var i=0; i<tableau.length; i++) {
			tableau_torender.push( {cards: Array()} );
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
	}

	// converts an integer to a card string
	function toCard(val) {
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

	deal();

})();
