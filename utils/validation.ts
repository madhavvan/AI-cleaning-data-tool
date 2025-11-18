import { DataRow, ColumnStats, ValidationResult, ValidationError } from '../types';

export const validateDataset = (data: DataRow[], columns: ColumnStats[]): ValidationResult => {
    const errors: ValidationError[] = [];
    let validCellCount = 0;
    let totalCellCount = 0;

    columns.forEach(col => {
        // Skip 'mixed' types or 'id' columns from strict type validation
        if (col.type === 'mixed' || col.name === 'id') return; 

        let issues = 0;
        const examples: string[] = [];

        data.forEach((row, idx) => {
            const val = row[col.name];
            totalCellCount++;
            let isValid = true;

            // We validate presence of value against type logic
            // Nulls/Empty strings are generally not "type errors" unless we enforced required fields
            // Here we strictly check if a value EXISTS, does it match the type?
            if (val !== null && val !== undefined && val !== '') {
                 if (col.type === 'number') {
                    if (typeof val !== 'number') isValid = false;
                } else if (col.type === 'boolean') {
                    if (typeof val !== 'boolean') isValid = false;
                }
                // Strings are generally permissive
            }
            
            if (!isValid) {
                issues++;
                if (examples.length < 3) {
                    // Show what the invalid value looks like
                    examples.push(String(val));
                }
            } else {
                validCellCount++;
            }
        });

        if (issues > 0) {
            errors.push({
                column: col.name,
                expectedType: col.type,
                issueCount: issues,
                examples
            });
        }
    });

    // Calculate score based on cells checked
    const score = totalCellCount === 0 ? 100 : Math.round((validCellCount / totalCellCount) * 100);

    return {
        isValid: errors.length === 0,
        score,
        errors,
        totalRowsChecked: data.length
    };
};