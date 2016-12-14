var bot = (function() {

	var active_cards = Array();

	// Cache DOM
	var $sol = $("#solitaire");
	var $stock = $sol.find("#stock").find('.stock');
	var $waste = $sol.find("#waste");
	var $foundation = $sol.find("#foundation");
	var $tableau = $sol.find("#tableau");

	var $tableau_piles = $tableau.find('#tableau-piles').children('li').find('ul');
	var $foundation_piles = $foundation.find('li');

	function findActiveCards() {

		cards = {foundation: Array(),
				 tableau: Array(),
				 waste: null };

		// Refresh references
		$waste = $sol.find("#waste").find('.card-movable');
		$tableau_piles = $tableau.find('#tableau-piles').children('li').find('ul');
		$foundation_piles = $foundation.find('li');

		if ($waste.text() != '') {
			var selection = {location: 'waste'};
			var card = toCard(selection);
			cards.waste = card;
		}


		for (var i=0; i<$tableau_piles.length; i++) {
			var selection = {location: 'tableau',
							 pile: i,
							 card: $tableau_piles.eq(i).children('li').length - 1};
			var card = toCard(selection);
			cards.tableau.push( card );
		}

		for (var i=0; i<$foundation_piles.length; i++) {
			var selection = {location: 'foundation',
							 pile: i};
			var card = toCard(selection);
			cards.foundation.push( card );
		}

		console.log(cards);
		return cards;
	}

	function findMoves() {
		// Make sure a waste card is available
		if ($waste.find('.card-movable').text() == '') {
			// Simulate a stock click
			$stock.trigger('click');
		}

		active_cards = findActiveCards();


		var moves = Array();
		// Scan tableau for moves first
		active_cards.tableau.forEach(function(card) {
			// Check if the card is primed for playing on a foundation
			active_cards.foundation.forEach(function(foundation_card) {
				if (card.value - foundation_card.value == 1 && (card.suit == foundation_card.suit || foundation_card.suit == 'none')) {
					moves.push( {movee: card,
								 target: card,
								 weight: 10 } );
				}
			});
		});

		executeMoves(moves);
	}

	function executeMoves(moves) {
		// sort moves via priority and attempt them if still legal
		function sortMoves(a, b) {
			if (a.weight > b.weight) {
				return 1;
			}
			else if (a.weight < b.weight) {
				return -1;
			}
			else {
				return 0;
			}
		}

		moves = moves.sort(sortMoves);

		moves.forEach(function(move) {
			clickCard(move.movee.selection);
			clickCard(move.target.selection);
		});
	}

	function getCardElement(sel) {
		// Selection object borrowed from the main program
		// location: 'waste'|'tableau'|'foundation'
		// pile: index
		// card: index
		
		var target = null;

		if (sel.location == 'waste') {
			target = $('#waste').find('.card-movable');
		}
		else if (sel.location == 'tableau') {
			target = $('#tableau-piles').children('li').find('ul').eq(sel.pile).children('li').eq(sel.card);
		}
		else if (sel.location == 'foundation') {
			target = $('#foundation').find('ul').children('li').eq(sel.pile);
		}

		return target;
	}

	function clickCard(sel) {
		getCardElement(sel).trigger('click');
	}

	function toCard(sel) {
		var $el = getCardElement(sel);
		var card_string = $el.text();

		if (card_string == '[ ]') {
			return { value: -1,
					 color: 'none',
					 suit: 'none' }
		}

		var card = card_string.split(' ');
		var value = card[0];
		var suit = card[1];

		if (value == 'J') {
			value = 10;
		}
		else if (value == 'Q') {
			value = 11;
		}
		else if (value == 'K') {
			value = 12;
		}
		else if (value == 'A') {
			value = 0;
		}
		else {
			value -= 1;
		}

		// Convert suit from icon to code
		// 9824 = spades
		// 9827 = club
		// 9829 = heart
		// 9830 = diamond
		suit = suit.charCodeAt(0);
		if (suit == 9829 || suit == 9830) {
			color = 'red';
		}
		else {
			color = 'black';
		}

		return { value: value,
				 color: color,
				 suit: suit,
	   			 selection: sel }
	}

	return { findMoves: findMoves }

})();
