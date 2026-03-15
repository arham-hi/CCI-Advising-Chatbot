import PromptSuggestionButton from "./PromptSuggestionButton"

const PromptSuggestionRow = ({onPromptClick}) => {
    const prompts = [
        "How many Concentration Technical Elective Courses do we need?",
        "How many Concentration Elective Courses do we need?",
    ]

    return(
        <div className = "prompt-suggestion-row">
            {prompts.map((prompt, index) => 
            <PromptSuggestionButton 
                key = {`suggestion-${index}`}
                text = {prompt}
                onClick={() => onPromptClick(prompt)}
            />)}
        </div>
    )
}

export default PromptSuggestionRow