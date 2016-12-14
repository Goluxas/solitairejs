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

	var draw_new_card = false;
	var no_move_streak = 0;

	function autoPlay() {
		while (no_move_streak < 50) {
			findMoves();
		}
	}

	function findActiveCards() {

		cards = {foundation: Array(),
				 tableau: Array(),
				 waste: null };

		// Refresh references
		$waste = $sol.find("#waste").find('.card-movable');
		$tableau_piles = $tableau.find('#tableau-piles').children('li').find('ul');
		$foundation_piles = $foundation.find('li');

		// Waste
		var selection = {location: 'waste'};
		var card = toCard(selection);
		cards.waste = card;

		// Tableau
		for (var i=0; i<$tableau_piles.length; i++) {
			var selection = {location: 'tableau',
							 pile: i,
							 card: $tableau_piles.eq(i).children('li').length - 1};
			var card = toCard(selection);
			cards.tableau.push( card );
		}

		// Foundation
		for (var i=0; i<$foundation_piles.length; i++) {
			var selection = {location: 'foundation',
							 pile: i};
			var card = toCard(selection);
			cards.foundation.push( card );
		}

		return cards;
	}

	function findMoves() {
		// Make sure a waste card is available
		$waste = $sol.find("#waste").find('.card-movable');
		if ($waste.text() == '' || draw_new_card) {
			// Simulate a stock click
			clickCard({location: 'stock'});
			draw_new_card = false;
		}

		active_cards = findActiveCards();

		var moves = Array();
		// Scan tableau for moves first
		active_cards.tableau.forEach(function(card) {
			// Check if the card is primed for playing on a foundation
			for (var i=0; i<active_cards.foundation.length; i++) {
				var foundation_card = active_cards.foundation[i];

				if (card.value - foundation_card.value == 1 && (card.suit == foundation_card.suit || foundation_card.suit == 'none')) {
					moves.push( {movee: card,
								 target: card,
								 weight: 10 } );
					break; // home found, move to the next tableau card
				}
			}

			// Check if the card can be moved onto another tableau
			for (var i=0; i<active_cards.tableau.length; i++) {
				var target = active_cards.tableau[i];

				if (card.selection.pile == target.selection.pile && card.selection.card == target.selection.card) {
					// that's this card, so skip it
					continue;
				}

				// If the card is an empty spot and this card is a king
				if (target.value == -1 && card.value == 12) {
					moves.push( {movee: card,
								 target: target,
								 weight: 1} );
				}

				// If the card can be moved onto another
				if (target.value - card.value == 1 && (card.color == 'red' && target.color == 'black' || card.color== 'black' && target.color == 'red')) { 
					moves.push( {movee: card,
								 target: target,
								 weight: 1} );
				}
			}
		});
		
		// Scan for moves with the waste card
		// Starting with foundation moves
		for (var i=0; i<active_cards.foundation.length; i++) {
			var foundation_card = active_cards.foundation[i];
			// Also check the waste card while we're here
			if (active_cards.waste.value - foundation_card.value == 1 && (active_cards.waste.suit == foundation_card.suit || foundation_card.suit == 'none')) {
				moves.push( {movee: active_cards.waste,
							 target: active_cards.waste,
							 weight: 10 } );
				break; // home found, waste settled
			}
		}

		if (moves.length != 0) {
			executeMoves(moves);
		}
		else {
			draw_new_card = true;
			no_move_streak += 1;
		}
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
			// Check that the cards are still what is expected
			var current_movee = toCard( move.movee.selection );
			var current_target = toCard( move.target.selection );
			if (sameCard(current_movee, move.movee) && sameCard(current_target, move.target)) {
				console.log('Moving ' + cardToString(move.movee) + ' to ' + cardToString(move.target));
				clickCard(move.movee.selection);
				clickCard(move.target.selection);
			}
			else {
				console.log('Skipping move, one or both cards already moved');
			}
		});
	}

	function sameCard(c1, c2) {
		if (c1.value == c2.value && c1.suit == c2.suit) {
			return true;
		}
		else {
			return false;
		}
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
		else if (sel.location == 'stock') {
			target = $('.stock')
		}

		return target;
	}

	function clickCard(sel) {
		getCardElement(sel).trigger('click');
	}

	function cardToString(card) {
		var str = '';
		if (card.value == -1) {
			str += 'Blank at ';

			if (card.selection.location == 'foundation') {
				str += 'Foundation Pile ' + card.selection.pile;
			}
			else if (card.selection.location == 'tableau') {
				str += 'Tableau Pile ' + card.selection.pile + ' Card ' + card.selection.card;
			}
			else if (card.selection.location == 'waste') {
				str += 'Waste';
			}

			return str;
		}
		else if (card.value == 0) {
			str += 'A ';
		}
		else if (card.value == 10) {
			str += 'J ';
		}
		else if (card.value == 11) {
			str += 'Q ';
		}
		else if (card.value == 12) {
			str += 'K ';
		}
		else {
			str += card.value+1 + ' ';
		}

		str += String.fromCharCode(card.suit);
		str += ' (' + card.selection.location + ')';

		return str;
	}

	function toCard(sel) {
		var $el = getCardElement(sel);
		var card_string = $el.text();

		if (card_string == '[ ]' || card_string == '') {
			return { value: -1,
					 color: 'none',
					 suit: 'none',
					 selection: sel }
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

	return { findMoves: findMoves,
			 autoPlay: autoPlay }

})();
