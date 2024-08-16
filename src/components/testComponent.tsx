import Persisted, { PersistedModel } from "./util/persisted";

export default class PersistTest extends Persisted {

    name?: string;

    buildFromStorage(id: string): void {
        this.name = "unpacked persistence test object";
    }
    create(options: PersistedModel): void {
        this.name = "created persistence test object";
    }
    
    serialize(): string {
        const propertiesOnly = Object.keys(this).reduce((acc, key) => {
            // @ts-expect-error
            const value = this[key];
            if (typeof value !== 'function') {
                // @ts-expect-error
                acc[key] = value;
            }
            return acc;
        }, {});
        console.log(propertiesOnly);
        return JSON.stringify(propertiesOnly);
    }

    render() {
        return (
            <>
                <h2>{this.name}</h2>
                <ul style={{ display: 'inline-block' }}>
                {Object.entries(this.GetCollection()).map(([key, entry]) => (
                    <li key={key}>{(entry as PersistTest).name}</li>
                ))}
                </ul>
            </>
        );
    }
}
