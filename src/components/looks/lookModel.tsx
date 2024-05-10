export default interface LookModel {

    // TODO: id and created shouldn't be nullable ...
    // fix referencing in App.tsx...

    id? : string;
    name? : string;
    // TODO: (big lift) Move to instance ...
    created?: Date;
}
