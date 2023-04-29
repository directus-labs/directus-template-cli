export interface Diff {
	hash: string
	diff: {
		collections: any[]
		fields: any[]
		relations: any[]
	}
}
