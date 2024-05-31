interface Presets {
	[key: number]: (number | number[])[][];
}

const csv = `
4,1,4,2,3,1,3,2,4,1,2,3,4
5,1,4,2,3,5,1,3,2,5,4,1,5,2,4,3,1,4,3,5,2,2,5,3,4,1
6,1,4,2,3,5,6,1,3,2,5,4,6,1,5,2,4,3,6,1,4,3,5,2,6,2,5,3,4,1,6,1,2,3,6,4,5
`;

export const getPresets = (numPlayers: number) => {
	const presets = parseCSV(csv);
	if (!presets[numPlayers]) {
		throw new Error('Static matchmaking is not supported for this number of players');
	}
	return presets[numPlayers];
};

function parseCSV(csv: string): Presets {
	const lines = csv.trim().split('\n');
	const presets: Presets = {};

	lines.forEach((line) => {
		const values = line.split(',').map(Number);
		const numPlayers = values[0];
		const pairings: (number | number[])[][] = [];

		for (let i = 1; i < values.length; i += numPlayers + 2) {
			const round: (number | number[])[] = [];
			for (let j = 0; j < numPlayers; j += 2) {
				if (values[i + j] && values[i + j + 1]) {
					round.push([values[i + j], values[i + j + 1]]);
				} else {
					round.push(values[i + j]);
				}
			}
			pairings.push(round);
		}

		presets[numPlayers] = pairings;
	});

	return presets;
}

// const pairings4: (number | number[])[][] = [
//     [[1, 4], [2, 3]],
//     [[1, 3], [2, 4]],
//     [[1, 2], [3, 4]]
// ];

// const pairings5: (number | number[])[][] = [
//     [[1, 4], [2, 3], 5],
//     [[1, 3], [2, 5], 4],
//     [[1, 5], [2, 4], 3],
//     [[1, 4], [3, 5], 2],
//     [[2, 5], [3, 4], 1]
// ];
