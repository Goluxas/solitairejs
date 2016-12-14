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

	var selection = {location: 'none'};

	// Bind Events
	$stock.click(draw);
	$sol.delegate('.card-movable', 'click', selectCard);

	function render() {
		$stock.html( Mustache.render(stock_tmp, {stock_amount: stock.length}) );

		var card = toCard(waste[waste.length-1]);
		var selected = '';
		if (selection.location == 'waste') {
			selected = 'card-selected';
		}
		$waste.html( Mustache.render(waste_tmp, {top_card: card.string, color: card.color, selected: selected}) );

		var foundation_torender = Array();
		for (var i=0; i<foundation.length; i++) {
			var selected = '';
			var card = null;
			if (foundation[i].length > 0) {
				card = toCard( foundation[i][foundation[i].length-1] );
			}
			else {
				card = {string: '[ ]', color: 'black'};
			}
			if (selection.location == 'foundation' && selection.pile == i) {
				selected = 'card-selected';
			}
			foundation_torender.push( {top_card: card.string, color: card.color, selected: selected} );
		}
		$foundation.html( Mustache.render(foundation_tmp, {piles: foundation_torender}) );

		//tableau_torender = {piles: cards: card}
		var tableau_torender = Array();
		for (var i=0; i<tableau.length; i++) {
			tableau_torender.push( {cards: Array()} );

			if (hidden_tableau[i] >= tableau[i].length) {
				hidden_tableau[i] = tableau[i].length - 1;
			}

			for (var j=0; j<tableau[i].length; j++) {
				var selected = '';
				if (hidden_tableau[i] > j) {
					tableau_torender[i].cards.push( {card: '--'} );
				}
				else {
					var card = toCard(tableau[i][j]);
					if (selection.location == 'tableau' && selection.pile == i && selection.card == j) {
						selected = 'card-selected';
					}
					tableau_torender[i].cards.push( {card: card.string, color: card.color, selected: selected} );
				}
			}
			
			// If the tableau pile is empty, display [ ]
			if (tableau[i].length == 0) {
				tableau_torender[i].cards.push( {card: '[ ]', color: 'black'} );
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

		return {string: value + ' ' + suit,
				color: Math.floor(val / 13) >= 2 ? 'red' : 'black' }
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

		// initialize waste and foundations to empty array
		waste = Array();
		for (var i=0; i<foundation.length; i++) {
			foundation[i] = Array();
		}

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

		var new_selection = null;
		if ( $target.hasClass('card-tableau') ) {
			var $tableaus_list = $tableau.find('#tableau-piles');
			var $pile = $target.closest('ul');

			var pile = $tableaus_list.children('li').index( $pile.closest('li') );
			var card = $pile.find('li').index( $target );

			new_selection = {location: 'tableau', pile: pile, card: card};
		}
		else if ( $target.hasClass('card-waste') ) {
			new_selection = {location: 'waste'};
		}
		else if ( $target.hasClass('card-foundation') ) {
			var $foundation_list = $foundation.find('ul');

			var pile = $foundation_list.children('li').index( $target );

			new_selection = {location: 'foundation', pile: pile};
		}

		// If another card was previous selected, try to move it
		if (selection.location != 'none') {
			// If the same card is selected, attempt an auto-move
			if (isSameSelection(selection, new_selection)) {
				autoMove(selection);
			}
			else if (isValidMove(selection, new_selection)) {
				moveCard(selection, new_selection);
			}
			else {
				console.log('Invalid Move');
			}

			selection = {location: 'none'};
		}
		else {
			selection = new_selection;
		}

		render();
	}

	function getCardFromSelection(sel) {
		if (sel.location == 'tableau') {
			raw_val = tableau[sel.pile][sel.card];
		}
		else if (sel.location == 'waste') {
			raw_val = waste[waste.length-1];
		}
		else if (sel.location == 'foundation') {
			raw_val = foundation[sel.pile][ foundation[sel.pile].length-1 ];
		}

		return { black : Math.floor(raw_val / 13) < 2,
				 value: raw_val % 13,
				 suit: Math.floor(raw_val / 13) }
	}

	function isValidMove(move_sel, target_sel) {
		var movee = getCardFromSelection(move_sel);
		var target = getCardFromSelection(target_sel);

		if (target_sel.location == 'waste') { 
			return false;
		}
		else if (target_sel.location == 'tableau') {
			// If the target to move to is not the bottom card of the tableau,
			// assume they meant to click the bottom instead
			target_sel.card = tableau[target_sel.pile].length - 1;
			target = getCardFromSelection(target_sel);

			if (move_sel.location == 'tableau') {

				// If the moving card is not revealed, the move is illegal
				if (move_sel.card < hidden_tableau[move_sel.pile]) {
					console.log('Cannot move hidden card');
					return false;
				}

				// If the moving card is not the bottom of its pile, check to see
				// if the stack is movable as a whole
				if (move_sel.card != tableau[move_sel.pile].length - 1) {
					if (!checkStack(move_sel.pile, move_sel.card)) {
						console.log('Illegal stack move')
						return false;
					}
				}
			}
			else if (move_sel.location == 'waste') {
				// no special rules
			}

			// Basic Tableau rule: card must be 1 under and the opposite color to move
			// OR you are moving a king onto an empty tableau
			if ((target.value - movee.value == 1 && movee.black != target.black) || (movee.value == 12 && tableau[target_sel.pile].length == 0)) {
				return true;
			}
		}
		else if ( target_sel.location == 'foundation' ) {
			// Can't move a card that's under a stack
			if (move_sel.location == 'tableau' && move_sel.card != tableau[move_sel.pile].length -1) {
				return false;
			}

			// Basic Foundation rule: Can place onto foundation if the card matches suit and is one higher
			// OR if you move an Ace to an empty pile
			if ( (movee.value - target.value == 1 && movee.suit == target.suit) || (movee.value == 0 && foundation[target_sel.pile].length == 0) ) {
				return true;
			}
		}
		else {
			return false;
		}
	}

	function moveCard(move_sel, target_sel) {
		var stack = Array();
		if (move_sel.location == 'tableau') {
			//
			// Move all the cards up to the move_sel onto the stack
			// (We already know the stack is valid to move.)
			for ( var i=tableau[move_sel.pile].length - 1; i >= move_sel.card; i-- ) {
				var card = tableau[move_sel.pile].pop();
				stack.push(card);
			}
		}
		else if (move_sel.location == 'waste') {
			var card = waste.pop();
			stack.push(card);
		}
		else if (move_sel.location == 'foundation') {
			var card = foundation[move_sel.pile].pop();
			stack.push(card);
		}

		var dest_array = null;
		if (target_sel.location == 'tableau') {
			dest_array = tableau[target_sel.pile];
		}
		else if (target_sel.location == 'foundation') {
			dest_array = foundation[target_sel.pile];
		}

		// If I use stack.length directly, it gets messed up by the
		// changing length with pop()
		var stack_count = stack.length;
		for ( var i=0; i<stack_count; i++ ) {
			var card = stack.pop();
			dest_array.push(card);
		}

		checkForWin();
		render();
	}

	function checkStack(pile, stack_top) {
		var prev_card = null;
		for ( var i=tableau[pile]; i >= stack_top; i-- ) {
			var new_card = getCardFromSelection({location: 'tableau', pile: pile, card: i});

			// If the previous card is not 1 lower and an opposite color, the stack is invalid
			if (prev_card && (new_card.value - prev_card.value != 1 || new_card.black == prev_card.black)) {
				return false;
			}
			
			prev_card = new_card;
		}

		return true;
	}

	function autoMove(sel) {
		var card = getCardFromSelection(sel);
		var target = null;

		// If it's under a stack, don't automove
		if (sel.location == 'tableau' && sel.card != tableau[sel.pile].length - 1) {
			console.log('Cannot AutoMove a stack');
			return;
		}

		// If it's an Ace, move it to an empty foundation pile
		if (card.value == 0) {
			for (var i=0; i<foundation.length; i++) {
				if (foundation[i].length == 0) {
					target = {location: 'foundation', pile: i};
					break;
				}
			}
		}

		// If it's not an Ace, see if there's a foundation it can buid on
		else {
			for (var i=0; i<foundation.length; i++) {
				var this_pile = {location: 'foundation', pile: i};
				var foundation_card = getCardFromSelection(this_pile);

				if (foundation_card.suit == card.suit && card.value - foundation_card.value == 1) {
					target = this_pile;
					break;
				}
			}
		}

		if (target) {
			// Move the card
			moveCard(sel, target);
		}
		else {
			console.log('No AutoMove found');
		}
	}

	function isSameSelection(sel1, sel2) {
		if (sel1.location != sel2.location) {
			return false;
		}

		if (sel1.location == 'tableau' && (sel1.pile != sel2.pile || sel1.card != sel2.card)) {
			return false;
		}

		if (sel1.location == 'foundation' && sel1.pile != sel2.pile) {
			return false;
		}

		return true;
	}

	function checkForWin() {
		var win = true;
		for (var i=0; i<foundation.length; i++) {
			var card = getCardFromSelection( {location: 'foundation', pile: i} );
			if (card.value != 12) {
				win = false;
			}
		}

		if (win) {
			console.log('Congratulations! You win!');
		}
	}

	deal();

})();
