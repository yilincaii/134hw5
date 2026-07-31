/* form-validation.js
   Part 1: Progressive enhancement on top of native HTML constraint
   validation. */

const form = document.querySelector('#contact-form');

if (form) {
	const fields = form.querySelectorAll('input, textarea');
	const errorLog = [];
	const hiddenErrorsField = form.querySelector('#form-errors');

	function describeError(field) {
		const validity = field.validity;
		if (validity.valueMissing) {
			return 'This field is required.';
		}
		if (validity.typeMismatch) {
			return 'Please enter a valid email address.';
		}
		if (validity.tooShort) {
			return `Please enter at least ${field.minLength} characters.`;
		}
		if (validity.tooLong) {
			return `Please enter no more than ${field.maxLength} characters.`;
		}
		if (validity.patternMismatch) {
			return 'Please match the requested format.';
		}
		// Fallback: whatever message the browser already generated.
		return field.validationMessage;
	}
	function errorType(field) {
		const validity = field.validity;
		if (validity.valueMissing) return 'valueMissing';
		if (validity.typeMismatch) return 'typeMismatch';
		if (validity.tooShort) return 'tooShort';
		if (validity.tooLong) return 'tooLong';
		if (validity.patternMismatch) return 'patternMismatch';
		return 'other';
	}

	function getOutput(field) {
		return form.querySelector(`output[for="${field.id}"]`);
	}

	function showMessage(field) {
		const output = getOutput(field);
		if (!output) return;

		if (field.validity.valid) {
			output.textContent = '';
		} else {
			output.textContent = describeError(field);
		}
	}

	function logError(field) {
		errorLog.push({
			field: field.name,
			type: errorType(field),
			timestamp: new Date().toISOString()
		});
		if (hiddenErrorsField) {
			hiddenErrorsField.value = JSON.stringify(errorLog);
		}
	}
	fields.forEach((field) => {
		field.addEventListener('input', () => showMessage(field));
		field.addEventListener('blur', () => showMessage(field));

		// 'invalid' does not bubble, so it must be attached per field.
		field.addEventListener('invalid', () => {
			showMessage(field);
			logError(field);
		});
	});

	// If 'submit' fires at all, every field already passed
	form.addEventListener('submit', () => {
		if (hiddenErrorsField) {
			hiddenErrorsField.value = JSON.stringify(errorLog);
		}
	});
}