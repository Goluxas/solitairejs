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
	var solved, played = 0;

	// surfaces stores the surface level index for each tableau pile
	var surfaces = Array();

	function testRuns(runs) {
		// run autoPlay 100x and see how many end in victory state
		solved = 0;
		played = 0;
		if (!runs) {
			runs = 100;
		}

		for (var i=0; i<runs; i++) {
			redeal();
			autoPlay();
			if (checkWin()) {
				solved += 1;
			}
			played += 1;
		}
		console.log('Solved ' + solved/played*100 + '% of games. (' + solved + '/' + played + ')');
	}

	function redeal() {
		solitaire.deal();
	}

	function autoPlay(speed) {
		no_move_streak = 0;
		while (no_move_streak < 50) {
			findMoves();
		}
	}

	function checkWin() {
		cards = findActiveCards();

		won = true;
		cards.foundation.forEach(function(card) {
			if (card.value != 12) {
				won = false;
			}
		});
		
		return won;
	}

	function findActiveCards() {

		cards = {foundation: Array(),
				 tableau: Array(),
				 waste: null,
				 priority: Array(),
		};

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
			var surface_index = $tableau_piles.eq(i).children('li').length-1;
			surfaces[i] = surface_index;
			var first_hidden_found = false;
			for (var j=surface_index; j>=0; j--) {
				var selection = {location: 'tableau',
								 pile: i,
								 card: j,
				};
				var card = toCard(selection);
				cards.tableau.push( card );

				// Set the top revealed card from each tableau as a movement priority
				if (card.value == -2 && !first_hidden_found) {
					var priority_card = toCard( {location: 'tableau',
												 pile: i,
												 card: j+1,
					});
					cards.priority.push( priority_card );
					first_hidden_found = true;
				}
			}
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
		for (var c=0; c<active_cards.tableau.length; c++) {
			var card = active_cards.tableau[c];

			var weight = 0;

			// Skip hidden cards
			if (c.value == -2) {
				continue;
			}

			// If this card is a priority card, raise the move weight
			for (var i=0; i<active_cards.priority.length; i++) {
				var pcard = active_cards.priority[i];

				if (sameCard(card, pcard)) {
					weight += 5;
					break;
				}
			}

			// Check if the card is primed for playing on a foundation
			if (card.selection.card == surfaces[card.selection.pile]) { // Only surface cards can be moved
				for (var i=0; i<active_cards.foundation.length; i++) {
					var foundation_card = active_cards.foundation[i];

					if (card.value - foundation_card.value == 1 && (card.suit == foundation_card.suit || foundation_card.suit == 'none')) {
						var move = {movee: card,
									target: foundation_card,
									weight: 10,
						};
						moves.push( move );
						break; // home found, move to the next tableau card
					}
				}
			}

			// Check if the card can be moved onto another tableau
			for (var i=0; i<active_cards.tableau.length; i++) {
				var target = active_cards.tableau[i];

				// skip if the target is not a surface card
				if (target.selection.card != surfaces[target.selection.pile]) {
					continue;
				}

				if (card.selection.pile == target.selection.pile && card.selection.card == target.selection.card) {
					// that's this card, so skip it
					continue;
				}

				// If the card is an empty spot and this card is a king that is not already at the top of a pile
				if (target.value == -1 && card.value == 12 && card.selection.card != 0) {
					var move = {movee: card,
								target: target,
								weight: 1,
					};
					moves.push( move );
				}

				// If the card can be moved onto another
				if (target.value - card.value == 1 && (card.color == 'red' && target.color == 'black' || card.color== 'black' && target.color == 'red')) { 
					// starting weight = 2 because it's better than moving a waste card
					var move = {movee: card,
								target: target,
								weight: 2,
					};

					// Check the parent card for strategic information
					if (card.selection.card != 0) {
						var parentCard_sel = {location: 'tableau',
											  pile: card.selection.pile,
											  card: card.selection.card - 1,
						};
						var parentCard = toCard( parentCard_sel );

						if (parentCard.color == target.color) {
							continue; // basically would move to mirror position; no benefit
						}
						// If the parent is hidden, raise the weight for this move
						if (parentCard.value == -2) {
							move.weight += 10;
						}
					}
					moves.push( move );
				}
			}
		}
		
		// Scan for moves with the waste card
		// Starting with foundation moves
		var waste = active_cards.waste;
		for (var i=0; i<active_cards.foundation.length; i++) {
			var foundation_card = active_cards.foundation[i];
			// Also check the waste card while we're here
			if (waste.value - foundation_card.value == 1 && (waste.suit == foundation_card.suit || foundation_card.suit == 'none')) {
				var move =  {movee: waste,
							 target: waste,
							 weight: 10,
				};
				moves.push(move);
				break; // home found, waste settled
			}
		}

		// Now for moves onto the tableau
		for (var i=0; i<active_cards.tableau.length; i++) {
			var target = active_cards.tableau[i];

			// Skip trying to move onto hidden cards and non-surface cards
			if (target.value == -2 || target.selection.card != surfaces[target.selection.pile]) {
				continue;
			}

			// Kings onto blanks
			if (target.value == -1 && waste.value == 12) {
				var move = {movee: waste,
							target: target,
							weight: 1,
				};
				moves.push( move );
			}

			// Anything onto normal tableau
			if (target.value - waste.value == 1 && (waste.color == 'red' && target.color == 'black' || waste.color== 'black' && target.color == 'red')) { 
				var move = {movee: waste,
							target: target,
							weight: 1,
				}; // starting weight = 1 because waste moves are low priority
				
				moves.push( move );
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
				return -1;
			}
			else if (a.weight < b.weight) {
				return 1;
			}
			else {
				return 0;
			}
		}

		moves = moves.sort(sortMoves);
		console.log(moves);

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
				console.log('Skipping move, one or both cards already moved: (' + cardToString(move.movee) + ', ' + cardToString(move.target) + ')');
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

		// empty spot
		if (card_string == '[ ]' || card_string == '') {
			return { value: -1,
					 color: 'none',
					 suit: 'none',
					 selection: sel }
		}

		// hidden card
		if (card_string == '--') {
			return { value: -2,
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
			 autoPlay: autoPlay,
			 testRuns: testRuns,
	};

})();
