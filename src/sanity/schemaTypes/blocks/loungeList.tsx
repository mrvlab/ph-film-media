import { ListIcon } from '@sanity/icons';
import { Card, Flex, Stack, Text } from '@sanity/ui';
import { defineField, defineType } from 'sanity';

// Read-only help text. Renders no editable fields, so nothing is ever stored
// on the block — it only tells the editor what the block does.
function LoungeListInput() {
  return (
    <Card padding={4} radius={2} tone='transparent' border>
      <Flex align='flex-start' gap={3}>
        <Text size={3} muted>
          <ListIcon />
        </Text>
        <Stack space={3}>
          <Text size={1} weight='semibold'>
            Lounge List
          </Text>
          <Text size={1} muted>
            Automatically shows all Lounge items, newest first. Nothing to
            configure here — manage items under Content → Lounge.
          </Text>
        </Stack>
      </Flex>
    </Card>
  );
}

export const loungeList = defineType({
  name: 'loungeList',
  title: 'Lounge List',
  type: 'object',
  icon: ListIcon,
  components: {
    input: LoungeListInput,
  },
  fields: [
    // Placeholder field: object types must declare at least one field. It's
    // hidden and never rendered (the custom input above replaces the form), so
    // no value is ever written to the document.
    defineField({
      name: 'note',
      title: 'Note',
      type: 'string',
      hidden: true,
      readOnly: true,
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Lounge List',
        subtitle: 'Shows all Lounge items (newest first)',
        media: ListIcon,
      };
    },
  },
});
