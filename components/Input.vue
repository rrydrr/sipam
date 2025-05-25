<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: false,
  },
  id: {
    type: String,
    default: () => `input-${Math.random().toString(36).substring(2, 9)}`,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  min: {
    type: [String, Number],
    required: false,
  },
  max: {
    type: [String, Number],
    required: false,
  },
  step: {
    type: [String, Number],
    required: false,
  },
  autocomplete: {
    type: String,
    required: false,
  },

  label: {
    type: String,
    default: '',
  },
  labelClass: {
    type: String,
    default: 'block text-sm font-medium text-gray-700 mb-1',
  },

  inputClass: {
    type: String,
    default: '',
  },
  containerClass: {
    type: String,
    default: 'mb-4',
  },
  bgColor: {
    type: String,
    default: 'bg-white',
  },
  textColor: {
    type: String,
    default: 'text-gray-900',
  },
  borderColor: {
    type: String,
    default: 'border-gray-300',
  },
  focusBorderColor: {
    type: String,
    default: 'focus:border-blue-500',
  },
  ringColor: {
    type: String,
    default: 'focus:ring-blue-500',
  },
  padding: {
    type: String,
    default: 'px-3 py-2',
  },
  rounded: {
    type: String,
    default: 'rounded-md',
  },
  fontSize: {
    type: String,
    default: 'text-base',
  },
  shadow: {
    type: String,
    default: 'shadow-sm',
  },
  width: {
    type: String,
    default: 'w-full',
  },

  error: {
    type: String,
    default: '',
  },
  errorClass: {
    type: String,
    default: 'mt-1 text-sm text-red-600',
  },
  isValid: {
    type: Boolean,
    default: null,
  },
  invalidBorderColor: {
    type: String,
    default: 'border-red-500',
  },
  validBorderColor: {
    type: String,
    default: 'border-green-500',
  },
});

const emit = defineEmits(['update:modelValue', 'change', 'input', 'blur', 'focus']);

// --- Password Visibility Logic ---
const showPassword = ref(false);

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// Compute the actual type attribute for the input
const inputElementType = computed(() => {
  return props.type === 'password' && showPassword.value ? 'text' : props.type;
});

// Compute dynamic classes for the input field
const computedInputClasses = computed(() => {
  const baseClasses = [
    'block',
    props.bgColor,
    props.textColor,
    props.padding,
    props.rounded,
    props.fontSize,
    props.shadow,
    'border',
    'focus:outline-none',
    'focus:ring-1',
    props.focusBorderColor,
    props.ringColor,
    'placeholder-gray-400',
    'w-full', // Always full width within its relative container
  ];

  // Adjust padding for password input when button is present
  if (props.type === 'password') {
    // Increased padding right to ensure space for the icon
    baseClasses.push('pr-12'); // Example: pr-12 (3rem)
  }

  // Add border color based on validation state or default
  if (props.isValid === false) {
    baseClasses.push(props.invalidBorderColor);
  } else if (props.isValid === true) {
    baseClasses.push(props.validBorderColor);
  } else {
    baseClasses.push(props.borderColor);
  }

  // Add disabled styles
  if (props.disabled) {
    baseClasses.push('cursor-not-allowed', 'opacity-75');
  }

  // Add any custom classes passed via props
  baseClasses.push(props.inputClass);

  return baseClasses.join(' ');
});

const handleInput = (event) => {
  emit('update:modelValue', event.target.value); // Directly update modelValue
  emit('input', event);
};

const handleChange = (event) => {
  emit('change', event);
};

const handleBlur = (event) => {
  emit('blur', event);
};

const handleFocus = (event) => {
  emit('focus', event);
};
</script>

<template>
  <div :class="containerClass">
    <label v-if="label" :for="id" :class="labelClass">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <div class="relative w-full">
      <input
        :id="id"
        :type="inputElementType" :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :readonly="readonly"
        :min="min"
        :max="max"
        :step="step"
        :autocomplete="autocomplete"
        :value="modelValue" :class="computedInputClasses"
        @input="handleInput"
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <button
        v-if="type === 'password'"
        type="button"
        @click="togglePasswordVisibility"
        :disabled="disabled"
        class="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-r-md"
        :class="{ 'cursor-not-allowed opacity-50': disabled, 'cursor-pointer': !disabled }"
        aria-label="Toggle password visibility"
      >
        <svg v-if="showPassword" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
        <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>
      </button>
    </div>

    <p v-if="error" :class="errorClass">{{ error }}</p>
  </div>
</template>

<style scoped>
/* No specific scoped styles needed if you're using Tailwind for everything */
</style>