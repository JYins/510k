# 510K Game Flow Pseudocode

## High-Level Game Loop

```
FUNCTION GameLoop(roomId):
    room = GET rooms/{roomId}

    IF room.status != "playing":
        RETURN "Game not in progress"

    gameState = room.gameState
    trick = gameState.currentTrick

    WHILE game.status == "playing":

        // Determine whose turn
        currentPlayer = gameState.currentTurnPlayerId

        // Wait for player action (play or pass)
        action = AWAIT getPlayerAction(currentPlayer)

        IF action.type == "play":
            result = processPlay(roomId, currentPlayer, action.cards)
        ELSE IF action.type == "pass":
            result = processPass(roomId, currentPlayer)

        // Check if trick ended
        IF result.trickEnded:
            resolveTrick(roomId)

            // Check if refill needed
            IF needsRefill(room):
                refillHands(roomId)

            // Check if game ended
            IF isGameOver(room):
                endGame(roomId)
                BREAK

        // Check for auto-settle (stuck game)
        IF shouldAutoSettle(room):
            autoSettle(roomId)
            endGame(roomId)
            BREAK

END FUNCTION
```

## Detailed Action Processing

### Play Cards

```
FUNCTION playCards(roomId, playerId, cardIndices):

    // ATOMIC TRANSACTION START
    RETURN runTransaction():

        // 1. Load state
        room = GET rooms/{roomId}
        private = GET roomPrivate/{roomId}

        // 2. Pre-condition checks
        ASSERT room.status == "playing", "Game not started"
        ASSERT room.gameState.currentTurnPlayerId == playerId, "Not your turn"
        ASSERT !private.processingAction, "Server busy"

        // 3. Lock processing
        SET private.processingAction = true

        // 4. Validate cards
        hand = private.hands[playerId]
        ASSERT all indices valid for hand length
        selectedCards = hand[cardIndices]

        // 5. Parse pattern
        play = parsePlay(selectedCards)
        ASSERT play != null, "Invalid pattern"

        // 6. Validate against current trick
        trick = room.gameState.currentTrick
        IF trick.plays.length > 0:
            currentHighest = trick.highestPlay
            ASSERT canBeat(play, currentHighest), "Must beat current play"

        // 7. Apply play
        remainingHand = removeCards(hand, cardIndices)
        private.hands[playerId] = remainingHand

        // 8. Update trick state
        playRecord = {
            playerId: playerId,
            cards: selectedCards,
            pattern: play.pattern,
            primaryValue: play.primaryValue,
            timestamp: now()
        }
        trick.plays.append(playRecord)
        trick.highestPlay = playRecord
        trick.trickPoints += countPoints(selectedCards)

        // 9. Update player
        player = room.players.find(p => p.id == playerId)
        player.cardsCount = remainingHand.length
        player.lastActionAt = now()

        // 10. Determine next state
        nextPlayerIndex = getNextPlayer(room, player.index)
        nextPlayerId = room.players[nextPlayerIndex].id

        // Check if trick should end
        otherPlayers = room.players.exclude(playerId)
        allOthersPlayedOrPassed = all(
            other.id in trick.passes OR
            other.id in trick.plays.map(p => p.playerId)
            for other in otherPlayers
        )

        IF allOthersPlayedOrPassed:
            trickEnded = true
        ELSE:
            trickEnded = false
            room.gameState.currentTurnIndex = nextPlayerIndex
            room.gameState.currentTurnPlayerId = nextPlayerId

        // 11. Update timestamps
        room.gameState.lastPlayTimestamp = now()
        room.gameState.consecutivePasses = 0
        room.lastActionAt = now()

        // 12. Unlock processing
        private.processingAction = false

        // 13. Write to audit log
        private.moveHistory.append({
            type: "play",
            playerId: playerId,
            pattern: play.pattern,
            timestamp: now()
        })

        // 14. Commit all writes
        WRITE rooms/{roomId} = room
        WRITE roomPrivate/{roomId} = private
        WRITE roomPrivate/{roomId}/hands/{playerId} = {hand: remainingHand}
        WRITE rooms/{roomId}/moves/{newId} = moveRecord

        RETURN {
            success: true,
            pattern: play.pattern,
            trickEnded: trickEnded
        }
    // ATOMIC TRANSACTION END

END FUNCTION
```

### Pass Turn

```
FUNCTION passTurn(roomId, playerId):

    RETURN runTransaction():

        // 1. Load state
        room = GET rooms/{roomId}
        private = GET roomPrivate/{roomId}

        // 2. Pre-condition checks
        ASSERT room.status == "playing", "Game not started"
        ASSERT room.gameState.currentTurnPlayerId == playerId, "Not your turn"
        ASSERT !private.processingAction, "Server busy"

        trick = room.gameState.currentTrick
        ASSERT trick.plays.length > 0, "Leader must play, cannot pass"

        // 3. Lock processing
        SET private.processingAction = true

        // 4. Record pass
        trick.passes.append(playerId)

        // 5. Update player
        player = room.players.find(p => p.id == playerId)
        player.lastActionAt = now()

        // 6. Determine next state
        nextPlayerIndex = getNextPlayer(room, player.index)
        nextPlayerId = room.players[nextPlayerIndex].id

        // Check if trick should end (everyone else has played or passed)
        leaderId = trick.leaderId
        otherPlayers = room.players.exclude(leaderId)
        allOthersResponded = all(
            other.id in trick.passes OR
            other.id in trick.plays.map(p => p.playerId)
            for other in otherPlayers
        )

        IF allOthersResponded:
            trickEnded = true
        ELSE:
            trickEnded = false
            room.gameState.currentTurnIndex = nextPlayerIndex
            room.gameState.currentTurnPlayerId = nextPlayerId
            room.gameState.consecutivePasses += 1

        // 7. Update timestamps
        room.lastActionAt = now()

        // 8. Unlock processing
        private.processingAction = false

        // 9. Audit log
        private.moveHistory.append({
            type: "pass",
            playerId: playerId,
            timestamp: now()
        })

        // 10. Commit
        WRITE rooms/{roomId} = room
        WRITE roomPrivate/{roomId} = private
        WRITE rooms/{roomId}/moves/{newId} = {type: "pass", playerId}

        RETURN {
            success: true,
            trickEnded: trickEnded
        }

END FUNCTION
```

### Resolve Trick

```
FUNCTION resolveTrick(roomId):

    RETURN runTransaction():

        room = GET rooms/{roomId}
        private = GET roomPrivate/{roomId}

        trick = room.gameState.currentTrick
        ASSERT trick.highestPlay != null, "No winner to resolve"

        winnerId = trick.highestPlay.playerId
        winner = room.players.find(p => p.id == winnerId)

        // 1. Award points
        winner.pointsCaptured += trick.trickPoints
        winner.tricksWon += 1
        room.gameState.totalPointsPlayed += trick.trickPoints

        // 2. Audit log
        private.moveHistory.append({
            type: "trick-won",
            playerId: winnerId,
            points: trick.trickPoints
        })

        // 3. Check if any player is out of cards
        playersOut = room.players.filter(p => p.cardsCount == 0)

        IF playersOut.length > 0:
            // Game ends - winner gets all remaining points
            remainingPoints = SUM(
                countPoints(private.hands[pid])
                for pid in private.hands.keys() if pid != winnerId
            )
            winner.pointsCaptured += remainingPoints

            endGame(roomId, winnerId, "normal")
            RETURN {gameEnded: true, needsRefill: false}

        // 4. Determine if refill needed
        // Refill when: trick had 0 points AND deck has cards
        needsRefill = (trick.trickPoints == 0) AND (private.deck.length > 0)

        // 5. Start new trick with winner as leader
        winnerIndex = room.players.findIndex(p => p.id == winnerId)

        room.gameState.currentTrick = {
            leaderId: winnerId,
            plays: [],
            highestPlay: null,
            passes: [],
            trickPoints: 0,
            startedAt: now()
        }
        room.gameState.currentTurnIndex = winnerIndex
        room.gameState.currentTurnPlayerId = winnerId
        room.gameState.roundNumber += 1
        room.gameState.consecutivePasses = 0

        WRITE rooms/{roomId} = room
        WRITE roomPrivate/{roomId} = private

        RETURN {gameEnded: false, needsRefill: needsRefill}

END FUNCTION
```

### Refill Hands

```
FUNCTION refillHands(roomId):

    RETURN runTransaction():

        room = GET rooms/{roomId}
        private = GET roomPrivate/{roomId}

        ASSERT private.deck.length > 0, "No cards to deal"

        startIndex = room.gameState.currentTurnIndex
        numPlayers = room.players.length

        // Deal clockwise from current player
        FOR offset IN 0 to numPlayers-1:
            playerIndex = (startIndex + offset) % numPlayers
            playerId = room.players[playerIndex].id
            hand = private.hands[playerId]

            WHILE hand.length < 5 AND private.deck.length > 0:
                card = private.deck.pop()
                hand.append(card)

            // Sort and update
            private.hands[playerId] = sortCards(hand)
            room.players[playerIndex].cardsCount = hand.length

        room.gameState.cardsInDeck = private.deck.length
        room.lastActionAt = now()

        private.moveHistory.append({
            type: "refill",
            timestamp: now()
        })

        WRITE rooms/{roomId} = room
        WRITE roomPrivate/{roomId} = private

        // Update all player hand documents
        FOR playerId, hand in private.hands:
            WRITE roomPrivate/{roomId}/hands/{playerId} = {
                playerId: playerId,
                hand: hand,
                updatedAt: now()
            }

END FUNCTION
```

### Auto-Settle

```
FUNCTION autoSettle(roomId):

    RETURN runTransaction():

        room = GET rooms/{roomId}
        private = GET roomPrivate/{roomId}

        // Check conditions
        ASSERT room.gameState.cardsInDeck == 0, "Deck not empty"
        ASSERT room.gameState.consecutivePasses >= room.players.length * 2,
               "Game not stuck"

        // Find player with highest remaining card
        winnerId = ""
        highestValue = -1
        highestSuit = -1

        FOR playerId, hand in private.hands:
            FOR card in hand:
                suitValue = getSuitValue(card.suit)
                IF card.value > highestValue OR
                   (card.value == highestValue AND suitValue > highestSuit):
                    highestValue = card.value
                    highestSuit = suitValue
                    winnerId = playerId

        // Calculate remaining points
        remainingPoints = SUM(countPoints(hand) for hand in private.hands.values())

        // Award to winner
        winner = room.players.find(p => p.id == winnerId)
        winner.pointsCaptured += remainingPoints

        private.moveHistory.append({
            type: "auto-settle",
            winnerId: winnerId,
            remainingPoints: remainingPoints
        })

        endGame(roomId, winnerId, "auto-settle")

        RETURN {winnerId, remainingPoints}

END FUNCTION
```

### End Game

```
FUNCTION endGame(roomId, winnerId, reason):

    room = GET rooms/{roomId}

    finalScores = {}
    FOR player in room.players:
        finalScores[player.id] = player.pointsCaptured

    room.status = "ended"
    room.endedAt = now()
    room.result = {
        winnerId: winnerId,
        finalScores: finalScores,
        reason: reason,
        endedAt: now()
    }
    room.lastActionAt = now()

    WRITE rooms/{roomId} = room

    RETURN room

END FUNCTION
```

## Pattern Validation

```
FUNCTION parsePlay(cards):

    IF cards.length == 1:
        RETURN {pattern: "single", primaryValue: cards[0].value}

    IF cards.length == 2:
        IF isJokerPair(cards):
            RETURN {pattern: "joker-bomb", isJokerBomb: true}
        IF sameRank(cards[0], cards[1]):
            RETURN {pattern: "pair", primaryValue: cards[0].value}
        RETURN null

    IF cards.length == 3 AND allSameRank(cards):
        RETURN {pattern: "triplet", primaryValue: cards[0].value}

    IF cards.length == 4:
        IF allSameRank(cards):
            RETURN {pattern: "bomb", primaryValue: cards[0].value}

        counts = countByRank(cards)
        IF counts == {3: 1, 1: 1}:  // One triplet, one single
            tripletRank = findRankWithCount(3)
            RETURN {
                pattern: "triplet+single",
                primaryValue: value(tripletRank)
            }

    IF cards.length == 5:
        counts = countByRank(cards)
        IF counts == {3: 1, 2: 1}:  // One triplet, one pair
            tripletRank = findRankWithCount(3)
            RETURN {
                pattern: "triplet+pair",
                primaryValue: value(tripletRank)
            }

    // Straight: 5+ consecutive, no 2/3/jokers
    IF cards.length >= 5 AND isConsecutiveSingles(cards):
        RETURN {
            pattern: "straight",
            primaryValue: maxValue(cards),
            length: cards.length
        }

    // Consecutive pairs: 3+ consecutive pairs, no 2/3/jokers
    IF cards.length >= 6 AND cards.length % 2 == 0:
        IF isConsecutivePairs(cards):
            RETURN {
                pattern: "consecutive-pairs",
                primaryValue: maxRankValue(cards),
                length: cards.length / 2
            }

    // Airplane: 2+ consecutive triplets, no 2/3/jokers
    IF cards.length >= 6 AND cards.length % 3 == 0:
        IF isConsecutiveTriplets(cards):
            RETURN {
                pattern: "airplane",
                primaryValue: maxRankValue(cards),
                length: cards.length / 3
            }

    RETURN null

END FUNCTION
```

## Comparison Logic

```
FUNCTION canBeat(newPlay, currentPlay):

    // Joker bomb is highest
    IF currentPlay.isJokerBomb:
        RETURN false
    IF newPlay.isJokerBomb:
        RETURN true

    // Bomb beats non-bomb
    IF currentPlay.pattern == "bomb":
        RETURN newPlay.pattern == "bomb" AND
               newPlay.primaryValue > currentPlay.primaryValue
    IF newPlay.pattern == "bomb":
        RETURN true

    // Must be same pattern
    IF newPlay.pattern != currentPlay.pattern:
        RETURN false

    // Must be same length for variable patterns
    IF newPlay.length != currentPlay.length:
        RETURN false

    // Higher primary value wins
    IF newPlay.primaryValue > currentPlay.primaryValue:
        RETURN true
    IF newPlay.primaryValue < currentPlay.primaryValue:
        RETURN false

    // Same value - compare highest card suit
    newHigh = findHighestCard(newPlay.cards)
    currentHigh = findHighestCard(currentPlay.cards)

    RETURN suitValue(newHigh.suit) > suitValue(currentHigh.suit)

END FUNCTION
```

## Frontend State Sync

```
// On mount
subscribeToRoom(roomId):

    // Subscribe to public room state
    roomUnsubscribe = onSnapshot(
        doc(db, "rooms", roomId),
        (snapshot) => {
            roomState = snapshot.data()
            renderPublicState(roomState)
        }
    )

    // Get private hand (one-time, then updated after each play)
    getGameState({roomId}).then(({myHand}) => {
        renderHand(myHand)
    })

    RETURN () => {
        roomUnsubscribe()
    }

// After playing cards
onPlayClick(cardIndices):

    // Optimistic UI (optional)
    removeCardsFromDisplay(cardIndices)
    showLoading()

    TRY:
        result = await playCards({roomId, cardIndices})

        IF result.trickEnded:
            showTrickWinner()

        // Hand will be updated via next getGameState call
        // or via optimistic update

    CATCH error:
        // Restore cards on error
        restoreCards(cardIndices)
        showError(error.message)

END FUNCTION
```
