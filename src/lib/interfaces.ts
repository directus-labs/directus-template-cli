export interface Diff {
	diff: {
		collections: any[]
		fields: any[]
		relations: any[]
	}
	hash: string
}
